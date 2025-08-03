import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { RecipeCardComponent } from '../../../shared/components/recipe-card/recipe-card.component';
import { RecipeSkeletonComponent } from '../../../shared/components/recipe-skeleton/recipe-skeleton.component';
import { RecipeService } from '../../../core/services/recipe.service';
import { AuthService } from '../../../core/services/auth.service';
import { FavoritesService } from '../../dashboard/services/favorites.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { 
  RecipeListItem, 
  RecipeSearchParams, 
  Category, 
  SearchSuggestion,
  SORT_OPTIONS, 
  DIFFICULTY_OPTIONS, 
  DIETARY_RESTRICTION_OPTIONS 
} from '../../../shared/models/recipe.models';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatPaginator } from '@angular/material/paginator';
import { MatCard } from '@angular/material/card';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { MatOption } from '@angular/material/core';
import { MatSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    RouterModule,
    MaterialModule, 
    RecipeCardComponent, 
    RecipeSkeletonComponent,
    MatSlideToggle
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss']})
export class RecipeListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollTrigger') scrollTrigger!: ElementRef;
  
  private destroy$ = new Subject<void>();
  private intersectionObserver?: IntersectionObserver;
  
  // Form controls
  searchControl!: FormControl;
  filterForm!: FormGroup;
  
  // State
  recipes: RecipeListItem[] = [];
  loading = true; // Start with loading true to show loading state immediately
  loadingMore = false;
  error: string | null = null;
  hasMoreData = true;
  private isInitialLoad = true;
  
  // Authentication state
  isAuthenticated$: Observable<boolean>;
  
  // Pagination vs Infinite Scroll
  usePagination = false; // Changed default to infinite scroll
  
  // Pagination
  currentPage = 1;
  pageSize = 12; // Temporarily reduced to test infinite scroll
  totalRecipes: number | null = null;
  
  // View state
  viewMode: 'grid' | 'list' = 'grid';
  currentSort = 'newest';
  
  // Filter options
  categories$!: Observable<Category[]>;
  searchSuggestions$ = new BehaviorSubject<SearchSuggestion[]>([]);
  
  // Constants
  SORT_OPTIONS = SORT_OPTIONS;
  DIFFICULTY_OPTIONS = DIFFICULTY_OPTIONS;
  DIETARY_RESTRICTION_OPTIONS = DIETARY_RESTRICTION_OPTIONS;
  
  // UI helpers
  skeletonArray = Array.from({ length: 12 }, (_, i) => i);
  favoriteLoadingIds = new Set<string>();

  constructor(
    private fb: FormBuilder,
    private recipeService: RecipeService,
    public authService: AuthService,
    private favoritesService: FavoritesService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize form controls
    this.searchControl = this.fb.control('');
    this.filterForm = this.createFilterForm();
    this.categories$ = this.recipeService.categories$;
    
    // Initialize authentication state
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  ngOnInit(): void {
    console.log('RecipeListComponent: ngOnInit started');
    
    // Initialize component and load recipes immediately
    this.initializeComponent();
    this.setupRouteSubscription();
    
    // Load recipes immediately to show loading state
    console.log('RecipeListComponent: Calling loadRecipes()');
    this.loadRecipes();
    
    // Refresh favorites cache in background (non-blocking)
    this.favoritesService.refreshCache().then(() => {
      console.log('RecipeListComponent: favorites cache refreshed');
    }).catch(error => {
      console.error('RecipeListComponent: Error refreshing favorites cache:', error);
    });
  }

  ngAfterViewInit(): void {
    // Setup infinite scroll after view is initialized
    if (!this.usePagination) {
      this.setupInfiniteScroll();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupInfiniteScroll();
  }

  private initializeComponent(): void {
    this.setupSearchSuggestions();
    this.setupSearchTrigger();
    this.setupFilterWatcher();
  }

  private setupInfiniteScroll(): void {
    console.log('RecipeListComponent: Setting up infinite scroll');
    
    // Clean up existing observer
    this.cleanupInfiniteScroll();
    
    // Check if scroll trigger element exists
    if (!this.scrollTrigger?.nativeElement) {
      console.warn('RecipeListComponent: Scroll trigger element not found');
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        console.log('RecipeListComponent: Intersection observer triggered', {
          isIntersecting: entry.isIntersecting,
          loading: this.loading,
          loadingMore: this.loadingMore,
          hasMoreData: this.hasMoreData,
          intersectionRatio: entry.intersectionRatio,
          boundingClientRect: entry.boundingClientRect
        });
        
        if (entry.isIntersecting && !this.loading && !this.loadingMore && this.hasMoreData) {
          console.log('RecipeListComponent: Loading more recipes via infinite scroll');
          this.loadMoreRecipes();
        } else {
          console.log('RecipeListComponent: Intersection observer triggered but conditions not met', {
            isIntersecting: entry.isIntersecting,
            loading: this.loading,
            loadingMore: this.loadingMore,
            hasMoreData: this.hasMoreData
          });
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    this.intersectionObserver.observe(this.scrollTrigger.nativeElement);
    console.log('RecipeListComponent: Infinite scroll observer attached');
  }

  private reSetupInfiniteScroll(): void {
    if (!this.usePagination) {
      // Use setTimeout to ensure the view has updated
      setTimeout(() => {
        this.setupInfiniteScroll();
        this.logInfiniteScrollState();
      }, 100);
    }
  }

  private logInfiniteScrollState(): void {
    console.log('RecipeListComponent: Infinite scroll state:', {
      usePagination: this.usePagination,
      hasMoreData: this.hasMoreData,
      loading: this.loading,
      loadingMore: this.loadingMore,
      recipesCount: this.recipes.length,
      totalRecipes: this.totalRecipes,
      scrollTriggerExists: !!this.scrollTrigger?.nativeElement,
      observerExists: !!this.intersectionObserver
    });
  }

  private cleanupInfiniteScroll(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
      console.log('RecipeListComponent: Infinite scroll observer cleaned up');
    }
  }

  loadMoreRecipes(): void {
    if (this.loadingMore || !this.hasMoreData || this.usePagination) {
      console.log('RecipeListComponent: Skipping loadMoreRecipes', {
        loadingMore: this.loadingMore,
        hasMoreData: this.hasMoreData,
        usePagination: this.usePagination
      });
      return;
    }

    console.log('RecipeListComponent: Loading more recipes');
    this.loadingMore = true;
    const nextPage = Math.floor(this.recipes.length / this.pageSize) + 1;
    
    const searchParams = {
      ...this.buildSearchParams(),
      page: nextPage
    };

    const hasSearchQuery = searchParams.q && searchParams.q.length > 0;
    const recipeObservable = hasSearchQuery
      ? this.recipeService.searchRecipes(searchParams)
      : this.recipeService.getRecipes(searchParams);

    recipeObservable.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('RecipeListComponent: More recipes loaded successfully:', response);
        const newRecipes = response.results || [];
        this.recipes = [...this.recipes, ...newRecipes];
        
        // Fix hasMoreData logic: check if there are more recipes available
        this.hasMoreData = this.recipes.length < (response.count || 0);
        
        this.loadingMore = false;
        this.cdr.markForCheck();
        console.log('RecipeListComponent: Total recipes after loading more:', this.recipes.length, 'total:', response.count, 'hasMoreData:', this.hasMoreData);
        
        // Re-setup infinite scroll after loading more recipes
        this.reSetupInfiniteScroll();
      },
      error: (error) => {
        console.error('RecipeListComponent: Error loading more recipes:', error);
        this.loadingMore = false;
        this.snackBar.open('Failed to load more recipes', 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      }
    });
  }

  togglePaginationMode(): void {
    this.usePagination = !this.usePagination;
    console.log('RecipeListComponent: Toggled pagination mode:', this.usePagination ? 'pagination' : 'infinite scroll');
    
    if (this.usePagination) {
      this.cleanupInfiniteScroll();
      this.currentPage = 1;
      this.loadRecipes();
    } else {
      this.currentPage = 1;
      this.hasMoreData = true;
      this.loadRecipes();
      // Setup infinite scroll after the view updates
      setTimeout(() => this.setupInfiniteScroll(), 100);
    }
  }

  private setupSearchTrigger(): void {
    // Trigger search automatically when user types (with debounce)
    this.searchControl.valueChanges.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((value) => {
      this.currentPage = 1; // Reset to first page on new search
      this.updateUrlAndLoadRecipes();
    });
  }

  private setupFilterWatcher(): void {
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.updateUrlAndLoadRecipes();
    });
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      categories: [[]],
      difficulty: [[]],
      dietary_restrictions: [[]]
    });
  }

  private setupRouteSubscription(): void {
    // Listen for route parameter changes and reload recipes
    this.route.queryParams.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    ).subscribe(queryParams => {
      this.processUrlParameters(queryParams);
      // Only reload if this is not the initial load
      if (!this.isInitialLoad) {
        this.loadRecipes();
      }
    });
  }

  private processUrlParameters(queryParams: any): void {
    
    // Read categories from URL
    if (queryParams['categories']) {
      const categories = Array.isArray(queryParams['categories']) 
        ? queryParams['categories'] 
        : [queryParams['categories']];
      this.filterForm.patchValue({ categories });
    }
    
    // Read search query from URL
    if (queryParams['q']) {
      this.searchControl.setValue(queryParams['q']);
    }
    
    // Read sort from URL
    if (queryParams['sort']) {
      this.currentSort = queryParams['sort'];
    }
    
    // Read difficulty from URL
    if (queryParams['difficulty']) {
      const difficulty = Array.isArray(queryParams['difficulty']) 
        ? queryParams['difficulty'] 
        : [queryParams['difficulty']];
      this.filterForm.patchValue({ difficulty });
    }
    
    // Read dietary restrictions from URL
    if (queryParams['dietary_restrictions']) {
      const dietaryRestrictions = Array.isArray(queryParams['dietary_restrictions']) 
        ? queryParams['dietary_restrictions'] 
        : [queryParams['dietary_restrictions']];
      this.filterForm.patchValue({ dietary_restrictions: dietaryRestrictions });
    }
  }

  private updateUrlAndLoadRecipes(): void {
    const searchQuery = this.searchControl.value?.trim();
    const filterValues = this.filterForm.value;
    
    // Build query parameters for URL
    const queryParams: any = {};
    
    if (searchQuery && searchQuery.length > 0) {
      queryParams.q = searchQuery;
    }
    
    if (this.currentSort !== 'newest') {
      queryParams.sort = this.currentSort;
    }
    
    if (filterValues.categories && filterValues.categories.length > 0) {
      queryParams.categories = filterValues.categories;
    }
    
    if (filterValues.difficulty && filterValues.difficulty.length > 0) {
      queryParams.difficulty = filterValues.difficulty;
    }
    
    if (filterValues.dietary_restrictions && filterValues.dietary_restrictions.length > 0) {
      queryParams.dietary_restrictions = filterValues.dietary_restrictions;
    }
    
    // Update URL without reloading the page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'replace'
    });
    
    // Load recipes with new parameters
    this.loadRecipes();
  }

  private setupSearchSuggestions(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          return of([]);
        }
        return this.recipeService.getSearchSuggestions(query).pipe(
          catchError(() => of([]))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(suggestions => {
      this.searchSuggestions$.next(suggestions);
    });
  }

  loadRecipes(): void {
    console.log('RecipeListComponent: loadRecipes() called, loading:', this.loading, 'isInitialLoad:', this.isInitialLoad);
    
    // Don't prevent loading if this is the initial load
    if (this.loading && !this.isInitialLoad) {
      console.log('RecipeListComponent: Skipping loadRecipes() - already loading and not initial load');
      return;
    }
    
    console.log('RecipeListComponent: Starting to load recipes');
    this.loading = true;
    this.error = null;
    
    // Reset recipes for new search/filter/sort unless we're in infinite scroll mode and loading more
    if (this.usePagination || this.currentPage === 1) {
      this.recipes = [];
      this.hasMoreData = true;
    }
    
    const searchParams = this.buildSearchParams();
    
    // Use searchRecipes for text search, getRecipes for basic listing
    const hasSearchQuery = searchParams.q && searchParams.q.length > 0;
    
    const recipeObservable = hasSearchQuery
      ? this.recipeService.searchRecipes(searchParams)
      : this.recipeService.getRecipes(searchParams);
    
    recipeObservable.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('RecipeListComponent: Recipes loaded successfully:', response);
        const newRecipes = response.results || [];
        
        if (this.usePagination || this.currentPage === 1) {
          this.recipes = newRecipes;
        } else {
          this.recipes = [...this.recipes, ...newRecipes];
        }
        
        this.totalRecipes = response.count || 0;
        
        // Fix hasMoreData logic: check if there are more recipes available
        if (this.usePagination) {
          // For pagination mode, check if current page * page size < total
          this.hasMoreData = (this.currentPage * this.pageSize) < this.totalRecipes;
        } else {
          // For infinite scroll mode, check if we have fewer recipes than total
          this.hasMoreData = this.recipes.length < this.totalRecipes;
        }
        
        this.loading = false;
        
        // Mark initial load as complete
        if (this.isInitialLoad) {
          this.isInitialLoad = false;
        }
        
        // The backend now provides is_favorited field directly, so no need to check manually
        this.cdr.markForCheck();
        console.log('RecipeListComponent: Loading complete, recipes count:', this.recipes.length, 'total:', this.totalRecipes, 'hasMoreData:', this.hasMoreData);
        
        // Re-setup infinite scroll after loading recipes
        this.reSetupInfiniteScroll();
        
        // Log state for debugging
        this.logInfiniteScrollState();
      },
      error: (error) => {
        console.error('RecipeListComponent: Error loading recipes:', error);
        this.error = 'Failed to load recipes. Please try again.';
        this.loading = false;
        
        // Mark initial load as complete even on error
        if (this.isInitialLoad) {
          this.isInitialLoad = false;
        }
        
        this.cdr.markForCheck();
      }
    });
  }

  private buildSearchParams(): RecipeSearchParams {
    const searchQuery = this.searchControl.value?.trim();
    const filterValues = this.filterForm.value;
    
    const params: RecipeSearchParams = {
      page: this.currentPage,
      page_size: this.pageSize,
      ordering: this.currentSort
    };
    
    // Only add search query if it's not empty
    if (searchQuery && searchQuery.length > 0) {
      params.q = searchQuery;
    }
    
    // Add filter parameters
    if (filterValues.categories && filterValues.categories.length > 0) {
      // If categories contain non-numeric values (slugs), use category_slugs parameter
      const hasNonNumeric = filterValues.categories.some((cat: any) => isNaN(Number(cat)));
      if (hasNonNumeric) {
        params.category_slugs = filterValues.categories;
      } else {
        params.categories = filterValues.categories.map((cat: any) => Number(cat));
      }
    }
    
    if (filterValues.difficulty && filterValues.difficulty.length > 0) {
      params.difficulty = filterValues.difficulty;
    }
    
    if (filterValues.cooking_method && filterValues.cooking_method.length > 0) {
      params.cooking_method = filterValues.cooking_method;
    }
    
    if (filterValues.max_prep_time) {
      params.max_prep_time = filterValues.max_prep_time;
    }
    
    if (filterValues.max_cook_time) {
      params.max_cook_time = filterValues.max_cook_time;
    }
    
    if (filterValues.min_servings) {
      params.min_servings = filterValues.min_servings;
    }
    
    if (filterValues.max_servings) {
      params.max_servings = filterValues.max_servings;
    }
    
    if (filterValues.dietary_restrictions && filterValues.dietary_restrictions.length > 0) {
      params.dietary_restrictions = filterValues.dietary_restrictions;
    }
    
    if (filterValues.author && filterValues.author.trim()) {
      params.author = filterValues.author.trim();
    }
    
    if (filterValues.min_rating) {
      params.min_rating = filterValues.min_rating;
    }
    
    if (filterValues.tags && filterValues.tags.length > 0) {
      params.tags = filterValues.tags;
    }
    
    return params;
  }

  // Event handlers
  onSearch(): void {
    this.currentPage = 1;
    this.hasMoreData = true;
    this.updateUrlAndLoadRecipes();
  }

  onSuggestionSelected(event: any): void {
    this.currentPage = 1;
    this.hasMoreData = true;
    this.updateUrlAndLoadRecipes();
  }

  onSortChange(event: MatSelectChange): void {
    this.currentSort = event.value;
    this.currentPage = 1;
    this.hasMoreData = true;
    this.updateUrlAndLoadRecipes();
  }

  onViewModeChange(event: MatButtonToggleChange): void {
    this.viewMode = event.value;
    this.cdr.markForCheck();
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadRecipes();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.filterForm.reset({
      categories: [],
      difficulty: [],
      dietary_restrictions: []
    });
    this.currentSort = 'newest';
    this.currentPage = 1;
    this.hasMoreData = true;
    this.recipes = [];
    this.updateUrlAndLoadRecipes();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.currentPage = 1;
    this.hasMoreData = true;
    this.updateUrlAndLoadRecipes();
  }

  clearCategoryFilter(): void {
    this.filterForm.patchValue({ categories: [] });
    this.currentPage = 1;
    this.hasMoreData = true;
    this.updateUrlAndLoadRecipes();
  }

  async onFavoriteToggle(recipeId: string): Promise<void> {
    // Check authentication state synchronously
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.favoriteLoadingIds.add(recipeId);
    
    try {
      const result = await this.favoritesService.toggleFavorite(recipeId);
      
      // Update the recipe in the list by creating a new array reference
      // This ensures OnPush change detection picks up the change
      const recipeIndex = this.recipes.findIndex(r => r.id === recipeId);
      if (recipeIndex !== -1) {
        this.recipes = [
          ...this.recipes.slice(0, recipeIndex),
          { ...this.recipes[recipeIndex], is_favorited: result.is_favorite },
          ...this.recipes.slice(recipeIndex + 1)
        ];
      }
      
      this.favoriteLoadingIds.delete(recipeId);
      this.cdr.markForCheck();
    } catch (error) {
      this.favoriteLoadingIds.delete(recipeId);
      this.snackBar.open('Failed to update favorite status', 'Close', { duration: 3000 });
      this.cdr.markForCheck();
    }
  }

  onShareRecipe(recipe: RecipeListItem): void {
    const url = `${window.location.origin}/recipes/${recipe.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: url
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url).then(() => {
        this.snackBar.open('Recipe link copied to clipboard!', 'Close', { duration: 3000 });
      });
    }
  }

  // Helper methods
  getEmptyStateMessage(): string {
    if (this.searchControl.value) {
      return `No recipes match your search for "${this.searchControl.value}". Try different keywords or clear your search.`;
    }
    
    return 'Be the first to share a recipe with our community!';
  }

  getSuggestionIcon(type: string): string {
    switch (type) {
      case 'recipe': return 'restaurant_menu';
      case 'ingredient': return 'eco';
      case 'category': return 'local_offer';
      case 'tag': return 'label';
      case 'author': return 'person';
      default: return 'search';
    }
  }

  trackByRecipeId(index: number, recipe: RecipeListItem): string {
    return recipe.id;
  }

  getAppliedCategoryFilter(): string | null {
    const categories = this.filterForm.get('categories')?.value;
    if (!categories || categories.length === 0) {
      return null;
    }
    
    // For now, show the first category if multiple are selected
    // In a more advanced implementation, you could show all categories
    const firstCategory = categories[0];
    
    // If it's a slug (string), return it formatted
    if (typeof firstCategory === 'string') {
      return firstCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // If it's an ID (number), find the category name from the categories observable
    // This would require additional logic to map ID to name
    return firstCategory.toString();
  }
} 