import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
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
  template: `
    <div class="recipe-list-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <div>
            <h1 class="page-title">Discover Recipes</h1>
            <p class="page-subtitle">Find your next favorite recipe from our collection</p>
          </div>
          <div class="header-actions">
            <button 
              *ngIf="isAuthenticated$ | async" 
              mat-raised-button 
              color="primary"
              routerLink="/recipes/create"
              class="create-button">
              <mat-icon>add</mat-icon>
              Create Recipe
            </button>
          </div>
        </div>
      </div>

      <!-- Search Section -->
      <div class="search-section">
        <mat-card class="search-card">
        <mat-card-content>
            <div class="search-bar-container">
              <mat-form-field class="search-field" appearance="fill">
                <mat-label>Search recipes...</mat-label>
                <input 
                  matInput 
                  [formControl]="searchControl"
                  [matAutocomplete]="auto">
                <mat-icon matSuffix>search</mat-icon>
                
                <mat-autocomplete 
                  #auto="matAutocomplete" 
                  (optionSelected)="onSuggestionSelected($event)">
                  <mat-option 
                    *ngFor="let suggestion of searchSuggestions$ | async" 
                    [value]="suggestion.value">
                    <mat-icon class="suggestion-icon">{{ getSuggestionIcon(suggestion.type) }}</mat-icon>
                    <span class="suggestion-text">{{ suggestion.display }}</span>
                    <span class="suggestion-type" *ngIf="suggestion.count">({{ suggestion.count }})</span>
                  </mat-option>
                </mat-autocomplete>
              </mat-form-field>

              <button 
                mat-raised-button 
                color="primary" 
                (click)="onSearch()"
                [disabled]="loading">
                <mat-icon>search</mat-icon>
                Search
              </button>
            </div>
        </mat-card-content>
      </mat-card>
    </div>

      <!-- Controls Section -->
      <div class="controls-section">
        <div class="results-info">
          <span *ngIf="!loading && totalRecipes !== null">
            {{ totalRecipes }} {{ totalRecipes === 1 ? 'recipe' : 'recipes' }} found
            <span *ngIf="searchControl.value" class="search-indicator">
              for "{{ searchControl.value }}"
              <button mat-icon-button (click)="clearSearch()" matTooltip="Clear search">
                <mat-icon>close</mat-icon>
              </button>
            </span>
            <span *ngIf="getAppliedCategoryFilter()" class="search-indicator">
              in category "{{ getAppliedCategoryFilter() }}"
              <button mat-icon-button (click)="clearCategoryFilter()" matTooltip="Clear category filter">
                <mat-icon>close</mat-icon>
              </button>
            </span>
          </span>
        </div>

        <div class="controls">
          <mat-form-field appearance="fill" class="sort-field">
            <mat-label>Sort by</mat-label>
            <mat-select [value]="currentSort" (selectionChange)="onSortChange($event)">
              <mat-option *ngFor="let option of SORT_OPTIONS" [value]="option.value">
                {{ option.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Pagination/Infinite Scroll Toggle -->
          <mat-slide-toggle 
            [checked]="!usePagination"
            (change)="togglePaginationMode()"
            class="scroll-toggle"
            matTooltip="Toggle between pagination and infinite scroll">
            Infinite Scroll
          </mat-slide-toggle>

          <mat-button-toggle-group 
            [value]="viewMode" 
            (change)="onViewModeChange($event)"
            class="view-toggle">
            <mat-button-toggle value="grid" matTooltip="Grid View">
              <mat-icon>grid_view</mat-icon>
            </mat-button-toggle>
            <mat-button-toggle value="list" matTooltip="List View">
              <mat-icon>view_list</mat-icon>
            </mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </div>

      <!-- Recipe Grid -->
      <div class="recipes-section">
        <!-- Loading State -->
        <div class="recipes-grid" *ngIf="loading" [class.list-view]="viewMode === 'list'">
          <app-recipe-skeleton *ngFor="let skeleton of skeletonArray"></app-recipe-skeleton>
        </div>

        <!-- Recipes Display -->
        <div 
          class="recipes-grid" 
          *ngIf="!loading && recipes.length > 0"
          [class.list-view]="viewMode === 'list'">
          <app-recipe-card
            *ngFor="let recipe of recipes; trackBy: trackByRecipeId"
            [recipe]="recipe"
            [favoriteLoading]="favoriteLoadingIds.has(recipe.id)"
            (favoriteToggle)="onFavoriteToggle($event)"
            (share)="onShareRecipe($event)">
          </app-recipe-card>
        </div>

        <!-- Infinite Scroll Trigger -->
        <div #scrollTrigger class="scroll-trigger" *ngIf="!usePagination && hasMoreData && !loading">
          <div class="loading-more" *ngIf="loadingMore">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading more recipes...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!loading && recipes.length === 0">
          <mat-icon class="empty-icon">restaurant_menu</mat-icon>
          <h3>No recipes found</h3>
          <p>{{ getEmptyStateMessage() }}</p>
          <button mat-raised-button color="primary" (click)="clearFilters()">
            <mat-icon>refresh</mat-icon>
            Clear Filters
          </button>
        </div>

        <!-- Error State -->
        <div class="error-state" *ngIf="error">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h3>Something went wrong</h3>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="loadRecipes()">
            <mat-icon>refresh</mat-icon>
            Try Again
          </button>
        </div>
      </div>

      <!-- Pagination (only in pagination mode) -->
      <div class="pagination-section" *ngIf="usePagination && !loading && totalRecipes && totalRecipes > 0">
        <mat-paginator
          [length]="totalRecipes || 0"
          [pageSize]="pageSize"
          [pageIndex]="currentPage - 1"
          [pageSizeOptions]="[12, 24, 48, 96]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .recipe-list-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .header-section {
      margin-bottom: 32px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-content > div:first-child {
      text-align: center;
      flex: 1;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 0 0 8px 0;
      color: #333;
    }

    .page-subtitle {
      font-size: 1.2rem;
      color: #666;
      margin: 0;
    }

    .create-button {
      min-width: 140px;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        text-align: center;
      }
      
      .header-actions {
        width: 100%;
        justify-content: center;
      }
    }

    .search-section {
      margin-bottom: 24px;
    }
    
    .search-card .mat-card-content {
      padding: 16px !important;
    }

    .search-card {
      overflow: visible;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-radius: 12px;
    }

    .search-bar-container {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .search-field {
      flex: 1;
    }
    
    /* Clean search field styling - no unwanted borders */
    .search-field .mat-mdc-form-field-outline,
    .search-field .mat-mdc-notched-outline {
      display: none !important;
    }
    
    .search-field .mat-mdc-form-field-outline-start,
    .search-field .mat-mdc-form-field-outline-notch,
    .search-field .mat-mdc-form-field-outline-end {
      display: none !important;
    }
    
    .search-field .mat-mdc-text-field-wrapper {
      background-color: #f8f9fa !important;
      border: 1px solid #e9ecef !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
    }
    
    .search-field.mat-focused .mat-mdc-text-field-wrapper {
      border-color: #2196F3 !important;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1) !important;
    }
    
    /* Sort field specific styling */
    .sort-field .mat-mdc-text-field-wrapper {
      background-color: #f8f9fa !important;
      border: 1px solid #e9ecef !important;
      border-radius: 8px !important;
      min-width: 160px !important;
    }
    
    .sort-field.mat-focused .mat-mdc-text-field-wrapper {
      border-color: #2196F3 !important;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1) !important;
    }

    .search-indicator {
      color: #666;
      font-style: italic;
      margin-left: 4px;
    }

    .search-indicator button {
      margin-left: 8px;
      width: 48px;
      height: 48px;
      line-height: 20px;
    }

    .suggestion-icon {
      margin-right: 8px;
      color: #666;
    }

    .suggestion-text {
      flex: 1;
    }

    .suggestion-type {
      color: #999;
      font-size: 0.875rem;
    }

    .controls-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .results-info {
      font-size: 1rem;
      color: #666;
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 16px;
      min-height: 56px;
      flex-wrap: wrap;
    }

    .sort-field {
      min-width: 150px;
      flex-shrink: 0;
    }

    .view-toggle {
      height: 50px;
      flex-shrink: 0;
    }

    .recipes-section {
      margin-bottom: 32px;
    }

    .recipes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
      padding: 16px 0;
    }

    .recipes-grid.list-view {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .empty-state,
    .error-state {
      text-align: center;
      padding: 64px 20px;
      color: #666;
    }

    .empty-icon,
    .error-icon {
      font-size: 4rem !important;
      width: 4rem !important;
      height: 4rem !important;
      line-height: 1 !important;
      display: block !important;
      margin: 0 auto 16px auto !important;
      opacity: 0.7 !important;
    }

    .error-icon {
      color: #f44336 !important;
      opacity: 0.8 !important;
    }

    .empty-state h3,
    .error-state h3 {
      margin: 0 0 8px 0;
      font-size: 1.5rem;
    }

    .empty-state p,
    .error-state p {
      margin: 0 0 24px 0;
    }

    .pagination-section {
      display: flex;
      justify-content: center;
      margin-top: 32px;
    }

    .scroll-toggle {
      margin-left: 16px;
    }

    .scroll-trigger {
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px 0;
    }

    .loading-more {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      color: #666;
    }

    .loading-more p {
      margin-top: 10px;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .recipe-list-container {
        padding: 16px;
      }

      .page-title {
        font-size: 2rem;
      }

      .search-bar-container {
        flex-direction: column;
      }

      .controls-section {
        flex-direction: column;
        align-items: stretch;
      }

      .controls {
        justify-content: space-between;
      }

      .recipes-grid {
        grid-template-columns: 1fr;
        gap: 12px;
        padding: 8px 0;
      }
    }

    @media (max-width: 600px) {
      .controls {
        flex-direction: column;
        gap: 12px;
      }

      .view-toggle {
        align-self: stretch;
      }
    }
  `]
})
export class RecipeListComponent implements OnInit, OnDestroy {
  @ViewChild('scrollTrigger') scrollTrigger!: ElementRef;
  
  private destroy$ = new Subject<void>();
  private intersectionObserver?: IntersectionObserver;
  
  // Form controls
  searchControl!: FormControl;
  filterForm!: FormGroup;
  
  // State
  recipes: RecipeListItem[] = [];
  loading = false;
  loadingMore = false;
  error: string | null = null;
  hasMoreData = true;
  
  // Authentication state
  isAuthenticated$: Observable<boolean>;
  
  // Pagination vs Infinite Scroll
  usePagination = true; // Toggle between pagination and infinite scroll
  
  // Pagination
  currentPage = 1;
  pageSize = 24;
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

  async ngOnInit(): Promise<void> {
    // Refresh favorites cache to ensure it's up to date
    await this.favoritesService.refreshCache();
    this.initializeComponent();
    this.setupRouteSubscription();
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
    
    // Setup infinite scroll after view init
    setTimeout(() => {
      if (!this.usePagination) {
        this.setupInfiniteScroll();
      }
    }, 100);
  }

  private setupInfiniteScroll(): void {
    if (!this.scrollTrigger?.nativeElement || this.intersectionObserver) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !this.loading && !this.loadingMore && this.hasMoreData) {
          this.loadMoreRecipes();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    this.intersectionObserver.observe(this.scrollTrigger.nativeElement);
  }

  private cleanupInfiniteScroll(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }
  }

  private loadMoreRecipes(): void {
    if (this.loadingMore || !this.hasMoreData || this.usePagination) {
      return;
    }

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
        const newRecipes = response.results || [];
        this.recipes = [...this.recipes, ...newRecipes];
        this.hasMoreData = newRecipes.length === this.pageSize;
        this.loadingMore = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loadingMore = false;
        this.snackBar.open('Failed to load more recipes', 'Close', { duration: 3000 });
        this.cdr.markForCheck();
        console.error('Error loading more recipes:', error);
      }
    });
  }

  togglePaginationMode(): void {
    this.usePagination = !this.usePagination;
    
    if (this.usePagination) {
      this.cleanupInfiniteScroll();
      this.currentPage = 1;
      this.loadRecipes();
    } else {
      this.currentPage = 1;
      this.hasMoreData = true;
      this.loadRecipes();
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
      this.loadRecipes();
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
    if (this.loading) return;
    
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
        const newRecipes = response.results || [];
        
        if (this.usePagination || this.currentPage === 1) {
          this.recipes = newRecipes;
        } else {
          this.recipes = [...this.recipes, ...newRecipes];
        }
        
        this.totalRecipes = response.count || 0;
        this.hasMoreData = newRecipes.length === this.pageSize;
        this.loading = false;
        
        // The backend now provides is_favorited field directly, so no need to check manually
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = 'Failed to load recipes. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
        console.error('Error loading recipes:', error);
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