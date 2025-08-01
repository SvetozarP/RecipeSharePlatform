import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/material.module';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

import { RecipeService } from '../../../../core/services/recipe.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Recipe, RecipeListItem, RecipeListResponse } from '../../../../shared/models/recipe.models';
import { UserStatisticsService } from '../../services/user-statistics.service';
import { RecipeStats } from '../../models/dashboard-data.model';

import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-recipe-management-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MaterialModule, 
    LoadingComponent,
    StarRatingComponent
  ],
  templateUrl: './recipe-management-dashboard.component.html',
  styleUrls: ['./recipe-management-dashboard.component.scss']
})
export class RecipeManagementDashboardComponent implements OnInit, OnDestroy {
  userRecipes: RecipeListItem[] = [];
  recipeStats: RecipeStats | null = null;
  filteredRecipes: RecipeListItem[] = [];
  
  // Filters and sorting
  statusFilter = 'all';
  sortOrder = 'newest';
  searchTerm = '';
  currentPage = 1;
  pageSize = 12;
  totalRecipes = 0;
  
  // View modes
  viewMode: 'grid' | 'list' = 'grid';
  isLoading = false;
  
  private destroy$ = new Subject<void>();
  private searchControl = new FormControl('');

  statusOptions = [
    { value: 'all', label: 'All Recipes', count: 0 },
    { value: 'published', label: 'Published', count: 0 },
    { value: 'draft', label: 'Drafts', count: 0 },
    { value: 'private', label: 'Private', count: 0 }
  ];
  
  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most-viewed', label: 'Most Viewed' },
    { value: 'highest-rated', label: 'Highest Rated' },
    { value: 'title', label: 'Title A-Z' }
  ];
  
  constructor(
    private recipeService: RecipeService,
    private userStatsService: UserStatisticsService,
    private router: Router,
    private authService: AuthService
  ) {}
  
  async ngOnInit(): Promise<void> {
    this.setupSearchControl();
    await this.loadUserRecipes();
    await this.loadRecipeStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchControl(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm || '';
      this.currentPage = 1;
      this.loadUserRecipes();
    });
  }
  
  private async loadUserRecipes(): Promise<void> {
    this.isLoading = true;
    
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.userRecipes = [];
        this.totalRecipes = 0;
        this.filteredRecipes = [];
        return;
      }

      const params = {
        ordering: this.getSortOrderValue(),
        q: this.searchTerm || undefined, // Use 'q' for search instead of 'search'
        page: this.currentPage,
        page_size: this.pageSize,
        author: currentUser.id // Filter by current user's ID
      };
      
      const response = await this.recipeService.getRecipes(params).toPromise();
      if (response) {
        this.userRecipes = response.results;
        this.totalRecipes = response.count;
        this.filteredRecipes = this.userRecipes;
      }
    } catch (error) {
      console.error('Failed to load user recipes:', error);
      // Provide fallback empty data
      this.userRecipes = [];
      this.totalRecipes = 0;
      this.filteredRecipes = [];
    } finally {
      this.isLoading = false;
    }
  }
  
  private async loadRecipeStats(): Promise<void> {
    try {
      this.recipeStats = await this.userStatsService.getRecipeStatistics();
      
      // Update status filter counts
      if (this.recipeStats) {
        this.statusOptions[0].count = this.recipeStats.total_recipes;
        this.statusOptions[1].count = this.recipeStats.published_recipes;
        this.statusOptions[2].count = this.recipeStats.draft_recipes;
        this.statusOptions[3].count = this.recipeStats.private_recipes;
      }
    } catch (error) {
      console.error('Failed to load recipe stats:', error);
    }
  }

  private getSortOrderValue(): string {
    switch (this.sortOrder) {
      case 'newest': return 'newest'; // Use semantic ordering supported by backend
      case 'oldest': return 'oldest';
      case 'most-viewed': return 'newest'; // Fallback to newest since view_count isn't supported
      case 'highest-rated': return 'rating'; // Use rating ordering supported by advanced search
      case 'title': return 'title';
      default: return 'newest';
    }
  }
  
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUserRecipes();
  }
  
  onSortChange(): void {
    this.currentPage = 1;
    this.loadUserRecipes();
  }
  
  onSearchChange(searchTerm: string): void {
    this.searchControl.setValue(searchTerm);
  }
  
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUserRecipes();
  }
  
  onViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }
  
  onCreateRecipe(): void {
    this.router.navigate(['/recipes/create']);
  }
  
  onEditRecipe(recipe: RecipeListItem): void {
    this.router.navigate(['/recipes', recipe.id, 'edit']);
  }
  
  onViewRecipe(recipe: RecipeListItem): void {
    this.router.navigate(['/recipes', recipe.id]);
  }
  
  onDuplicateRecipe(recipe: RecipeListItem): void {
    // TODO: Implement recipe duplication
    console.log('Duplicate recipe:', recipe.id);
  }
  
  onDeleteRecipe(recipe: RecipeListItem): void {
    // TODO: Implement recipe deletion with confirmation
    console.log('Delete recipe:', recipe.id);
  }
  
  onToggleStatus(recipe: RecipeListItem): void {
    // TODO: Implement status toggle functionality
    console.log('Toggle status for recipe:', recipe.id);
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'published': return 'primary';
      case 'draft': return 'accent';
      case 'private': return 'warn';
      default: return '';
    }
  }

  getRecipeImageUrl(recipe: RecipeListItem): string {
    // Check if the recipe has any images available
    if (recipe.thumbnail_url) {
      return recipe.thumbnail_url;
    }
    
    // If no thumbnail, check for main image URL
    if ((recipe as any).main_image_url) {
      return (recipe as any).main_image_url;
    }
    
    // If no images available, return placeholder
    return this.getPlaceholderImage();
  }

  private getPlaceholderImage(): string {
    // Create a data URL for a clean placeholder (same as recipe card component)
    const svg = `
      <svg width="350" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)"/>
        <circle cx="175" cy="70" r="20" fill="#dee2e6"/>
        <path d="M165 75 L175 65 L185 75 L180 80 L175 75 L170 80 Z" fill="#6c757d"/>
        <rect x="155" y="110" width="40" height="4" rx="2" fill="#dee2e6"/>
        <rect x="160" y="120" width="30" height="3" rx="1" fill="#e9ecef"/>
        <rect x="165" y="128" width="20" height="3" rx="1" fill="#e9ecef"/>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.getPlaceholderImage();
  }

  getRecipeRating(recipe: RecipeListItem): number {
    return recipe.rating_stats?.average_rating || 0;
  }

  getRecipeRatingCount(recipe: RecipeListItem): number {
    return recipe.rating_stats?.total_ratings || 0;
  }
  
  trackByRecipeId(index: number, recipe: RecipeListItem): string {
    return recipe.id;
  }

  // Pagination helpers
  get totalPages(): number {
    return Math.ceil(this.totalRecipes / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecipes);
  }

  get hasRecipes(): boolean {
    return this.userRecipes && this.userRecipes.length > 0;
  }
}