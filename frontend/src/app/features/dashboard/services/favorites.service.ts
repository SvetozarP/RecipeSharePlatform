import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
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
      const response = await this.apiService.get<PaginatedResponse<Recipe>>('/recipes/favorites/', { params }).toPromise();
      
      // Update cache with recipe IDs
      if (response && response.results) {
        this.favoritesCache = response.results.map(recipe => recipe.id);
        this.favoriteRecipesSubject.next([...this.favoritesCache]);
      }
      
      return response || {
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
      const response = await this.apiService.post<Favorite>('/recipes/favorites/', { recipe_id: recipeId }).toPromise();
      
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
      // Use backend API to remove from favorites
      await this.apiService.delete(`/recipes/favorites/${recipeId}/`).toPromise();
      
      // Update local cache
      this.removeFromFavoritesLocal(recipeId);
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      throw error;
    }
  }

  async bulkRemoveFromFavorites(recipeIds: string[]): Promise<void> {
    try {
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
      const response = await this.apiService.get<{is_favorite: boolean}>(`/recipes/favorites/check/?recipe_id=${recipeId}`).toPromise();
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

  async toggleFavorite(recipeId: string): Promise<{is_favorite: boolean, message: string}> {
    try {
      // Use backend API to toggle favorite status
      const response = await this.apiService.post<{is_favorite: boolean, message: string}>('/recipes/favorites/toggle/', { recipe_id: recipeId }).toPromise();
      
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