import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Recipe, PaginatedResponse } from '../../../shared/models/recipe.models';

export interface Favorite {
  id: string;
  recipe: Recipe;
  created_at: string;
}

export interface FavoriteParams {
  page?: number;
  page_size?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favoriteRecipesSubject = new BehaviorSubject<string[]>([]);
  public favoriteRecipes$ = this.favoriteRecipesSubject.asObservable();
  private favoritesCache: string[] = [];

  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  constructor() {
    this.loadFavoritesFromBackend();
  }

  async getFavoriteRecipes(params?: FavoriteParams): Promise<PaginatedResponse<Recipe>> {
    try {
      // Use backend API to get favorites
      const response = await firstValueFrom(this.apiService.get<any>('/recipes/favorites/', { params }));
      
      // The backend returns UserFavorite objects with a 'recipe' property
      // We need to extract the recipe objects from the results
      if (response && response.results && Array.isArray(response.results)) {
        // Extract recipe objects from UserFavorite objects
        const recipes = response.results.map((favorite: any) => favorite.recipe);
        this.favoritesCache = recipes.map((recipe: Recipe) => recipe.id);
        this.favoriteRecipesSubject.next([...this.favoritesCache]);
        
        // Return the response with extracted recipes
        return {
          count: response.count || 0,
          next: response.next,
          previous: response.previous,
          results: recipes
        };
      }
      
      return {
        count: 0,
        next: null,
        previous: null,
        results: []
      };
    } catch (error) {
      console.error('Failed to load favorite recipes:', error);
      return {
        count: 0,
        next: null,
        previous: null,
        results: []
      };
    }
  }

  async addToFavorites(recipeId: string): Promise<Favorite> {
    try {
      // Use backend API to add to favorites
      const response = await firstValueFrom(this.apiService.post<Favorite>('/recipes/favorites/', { recipe_id: recipeId }));
      
      if (!response) {
        throw new Error('Failed to add to favorites: No response received');
      }
      
      // Update local cache
      if (!this.favoritesCache.includes(recipeId)) {
        this.favoritesCache.push(recipeId);
        this.favoriteRecipesSubject.next([...this.favoritesCache]);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(recipeId: string): Promise<void> {
    try {
      // Use the toggle endpoint to remove from favorites
      // The toggle endpoint will remove the favorite if it exists
      const response = await firstValueFrom(this.apiService.post<{is_favorite: boolean, message: string}>('/recipes/favorites/toggle/', { recipe_id: recipeId }));
      
      if (!response) {
        throw new Error('Failed to remove from favorites: No response received');
      }
      
      // Update local cache
      this.removeFromFavoritesLocal(recipeId);
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      throw error;
    }
  }

  async bulkRemoveFromFavorites(recipeIds: string[]): Promise<void> {
    try {
      // Remove each recipe from favorites using the toggle endpoint
      const removePromises = recipeIds.map(recipeId => 
        firstValueFrom(this.apiService.post<{is_favorite: boolean, message: string}>('/recipes/favorites/toggle/', { recipe_id: recipeId }))
      );
      
      await Promise.all(removePromises);
      
      // Update local cache
      recipeIds.forEach(recipeId => {
        this.removeFromFavoritesLocal(recipeId);
      });
    } catch (error) {
      console.error('Failed to bulk remove from favorites:', error);
      throw error;
    }
  }

  async isFavorite(recipeId: string): Promise<boolean> {
    try {
      // Use backend API to check favorite status
      const response = await firstValueFrom(this.apiService.get<{is_favorite: boolean}>(`/recipes/favorites/check/?recipe_id=${recipeId}`));
      return response?.is_favorite || false;
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      // Fallback to local cache
      return this.favoritesCache.includes(recipeId);
    }
  }

  // Backend API management
  private async loadFavoritesFromBackend(): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      // Load favorites from backend
      const response = await this.getFavoriteRecipes();
      if (response && response.results) {
        this.favoritesCache = response.results.map(recipe => recipe.id);
        this.favoriteRecipesSubject.next([...this.favoritesCache]);
      }
    } catch (error) {
      console.error('Failed to load favorites from backend:', error);
      this.favoritesCache = [];
    }
  }

  private removeFromFavoritesLocal(recipeId: string): void {
    const index = this.favoritesCache.indexOf(recipeId);
    if (index > -1) {
      this.favoritesCache.splice(index, 1);
      this.favoriteRecipesSubject.next([...this.favoritesCache]);
    }
  }

  // Get favorite count for dashboard
  getFavoriteCount(): number {
    return this.favoritesCache.length;
  }

  // Observable methods for reactive programming
  getFavoriteRecipesObservable(params?: FavoriteParams): Observable<PaginatedResponse<Recipe>> {
    return new Observable(observer => {
      this.getFavoriteRecipes(params).then(result => {
        observer.next(result);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  addToFavoritesObservable(recipeId: string): Observable<Favorite> {
    return new Observable(observer => {
      this.addToFavorites(recipeId).then(result => {
        observer.next(result);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  removeFromFavoritesObservable(recipeId: string): Observable<void> {
    return new Observable(observer => {
      this.removeFromFavorites(recipeId).then(() => {
        observer.next();
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  // Clear favorites cache
  clearCache(): void {
    this.favoritesCache = [];
    this.favoriteRecipesSubject.next([]);
  }

  // Refresh favorites cache from backend
  async refreshCache(): Promise<void> {
    await this.loadFavoritesFromBackend();
  }

  async toggleFavorite(recipeId: string): Promise<{is_favorite: boolean, message: string}> {
    try {
      // Use backend API to toggle favorite status
      const response = await firstValueFrom(this.apiService.post<{is_favorite: boolean, message: string}>('/recipes/favorites/toggle/', { recipe_id: recipeId }));
      
      if (!response) {
        throw new Error('Failed to toggle favorite: No response received');
      }
      
      // Update local cache based on response
      if (response.is_favorite) {
        if (!this.favoritesCache.includes(recipeId)) {
          this.favoritesCache.push(recipeId);
        }
      } else {
        this.removeFromFavoritesLocal(recipeId);
      }
      
      this.favoriteRecipesSubject.next([...this.favoritesCache]);
      return response;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }
}