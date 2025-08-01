import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/material.module';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

import { RecipeService } from '../../../../core/services/recipe.service';
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
    private router: Router
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
      const params = {
        status: this.statusFilter === 'all' ? undefined : this.statusFilter,
        ordering: this.getSortOrderValue(),
        search: this.searchTerm || undefined,
        page: this.currentPage,
        page_size: this.pageSize,
        author: 'me' // Filter for current user's recipes
      };
      
      const response = await this.recipeService.searchRecipes(params).toPromise();
      if (response) {
        this.userRecipes = response.results;
        this.totalRecipes = response.count;
        this.filteredRecipes = this.userRecipes;
      }
    } catch (error) {
      console.error('Failed to load user recipes:', error);
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
      case 'newest': return '-created_at';
      case 'oldest': return 'created_at';
      case 'most-viewed': return '-view_count';
      case 'highest-rated': return '-rating';
      case 'title': return 'title';
      default: return '-created_at';
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
    return recipe.thumbnail_url || '/assets/images/recipe-placeholder.jpg';
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