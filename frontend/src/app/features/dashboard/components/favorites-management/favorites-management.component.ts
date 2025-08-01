import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/material.module';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

import { FavoritesService } from '../../services/favorites.service';
import { CollectionsService } from '../../services/collections.service';
import { Recipe, PaginatedResponse } from '../../../../shared/models/recipe.models';
import { Collection } from '../../models/dashboard-data.model';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-favorites-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MaterialModule, 
    LoadingComponent,
    StarRatingComponent,
    RouterModule
  ],
  templateUrl: './favorites-management.component.html',
  styleUrls: ['./favorites-management.component.scss']
})
export class FavoritesManagementComponent implements OnInit, OnDestroy {
  favoriteRecipes: Recipe[] = [];
  collections: Collection[] = [];
  selectedCollection: Collection | null = null;
  
  isLoading = false;
  viewMode: 'grid' | 'list' = 'grid';
  sortOrder = 'newest';
  currentPage = 1;
  pageSize = 20;
  totalFavorites = 0;
  
  private destroy$ = new Subject<void>();
  
  sortOptions = [
    { value: 'newest', label: 'Recently Added' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'difficulty', label: 'Difficulty' }
  ];
  
  constructor(
    private favoritesService: FavoritesService,
    private collectionsService: CollectionsService,
    private router: Router
  ) {}
  
  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadFavoriteRecipes(),
      this.loadCollections()
    ]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private async loadFavoriteRecipes(): Promise<void> {
    this.isLoading = true;
    
    try {
      const params = {
        collection_id: this.selectedCollection?.id,
        ordering: this.getSortOrderValue(),
        page: this.currentPage,
        page_size: this.pageSize
      };
      
      const response = await this.favoritesService.getFavoriteRecipes(params);
      this.favoriteRecipes = response.results;
      this.totalFavorites = response.count;
    } catch (error) {
      console.error('Failed to load favorite recipes:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  private async loadCollections(): Promise<void> {
    try {
      this.collections = await this.collectionsService.getUserCollections();
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }

  private getSortOrderValue(): string {
    switch (this.sortOrder) {
      case 'newest': return '-created_at';
      case 'oldest': return 'created_at';
      case 'rating': return '-rating';
      case 'title': return 'title';
      case 'difficulty': return 'difficulty';
      default: return '-created_at';
    }
  }
  
  onCollectionSelect(collection: Collection | null): void {
    this.selectedCollection = collection;
    this.currentPage = 1;
    this.loadFavoriteRecipes();
  }
  
  onSortChange(): void {
    this.currentPage = 1;
    this.loadFavoriteRecipes();
  }
  
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadFavoriteRecipes();
  }

  onViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }
  
  onCreateCollection(): void {
    // TODO: Implement collection creation dialog
    console.log('Create collection');
  }
  
  async onRemoveFromFavorites(recipe: Recipe): Promise<void> {
    try {
      await this.favoritesService.removeFromFavorites(Number(recipe.id));
      this.favoriteRecipes = this.favoriteRecipes.filter(r => r.id !== recipe.id);
      this.totalFavorites--;
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
    }
  }
  
  onAddToCollection(recipe: Recipe): void {
    // TODO: Implement add to collection dialog
    console.log('Add to collection:', recipe.id);
  }
  
  onViewRecipe(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.id]);
  }
  
  onBulkAction(action: string, selectedRecipes: Recipe[]): void {
    if (selectedRecipes.length === 0) {
      return;
    }
    
    switch (action) {
      case 'remove-favorites':
        this.bulkRemoveFromFavorites(selectedRecipes);
        break;
      case 'add-to-collection':
        this.bulkAddToCollection(selectedRecipes);
        break;
      default:
        console.log('Unknown bulk action:', action);
    }
  }
  
  private async bulkRemoveFromFavorites(recipes: Recipe[]): Promise<void> {
    try {
      const recipeIds = recipes.map(r => Number(r.id));
      await this.favoritesService.bulkRemoveFromFavorites(recipeIds);
      await this.loadFavoriteRecipes();
    } catch (error) {
      console.error('Failed to remove recipes:', error);
    }
  }
  
  private bulkAddToCollection(recipes: Recipe[]): void {
    // TODO: Implement bulk add to collection
    console.log('Bulk add to collection:', recipes.length, 'recipes');
  }

  getRecipeImageUrl(recipe: Recipe): string {
    return recipe.thumbnail_url || recipe.main_image_url || '/assets/images/recipe-placeholder.jpg';
  }

  getRecipeRating(recipe: Recipe): number {
    return recipe.rating_stats?.average_rating || 0;
  }

  getRecipeRatingCount(recipe: Recipe): number {
    return recipe.rating_stats?.total_ratings || 0;
  }
  
  trackByRecipeId(index: number, recipe: Recipe): string {
    return recipe.id;
  }

  get hasFavorites(): boolean {
    return this.favoriteRecipes && this.favoriteRecipes.length > 0;
  }

  get hasCollections(): boolean {
    return this.collections && this.collections.length > 0;
  }

  // Pagination helpers
  get totalPages(): number {
    return Math.ceil(this.totalFavorites / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalFavorites);
  }
}