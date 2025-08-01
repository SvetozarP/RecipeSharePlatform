import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Recipe, PaginatedResponse } from '../../../shared/models/recipe.models';

export interface Favorite {
  id: string;
  recipe: Recipe;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favoriteRecipesSubject = new BehaviorSubject<string[]>([]);
  public favoriteRecipes$ = this.favoriteRecipesSubject.asObservable();
  private favoritesCache: string[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.loadFavoritesFromStorage();
  }

  async getFavoriteRecipes(params?: any): Promise<PaginatedResponse<Recipe>> {
    try {
      // Since we don't have a favorites endpoint, we'll simulate it
      // by storing favorite IDs locally and fetching those recipes
      if (this.favoritesCache.length === 0) {
        return {
          count: 0,
          next: null,
          previous: null,
          results: []
        };
      }

      // Get recipe details for favorite IDs
      const favoriteRecipes: Recipe[] = [];
      for (const recipeId of this.favoritesCache) {
        try {
          const recipe = await this.apiService.get<Recipe>(`/recipes/${recipeId}/`).toPromise();
          if (recipe) {
            favoriteRecipes.push(recipe);
          }
        } catch (error) {
          // Recipe might not exist anymore, remove from favorites
          this.removeFromFavoritesLocal(recipeId);
        }
      }

      // Apply pagination if needed
      const page = params?.page || 1;
      const pageSize = params?.page_size || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedResults = favoriteRecipes.slice(startIndex, endIndex);

      return {
        count: favoriteRecipes.length,
        next: endIndex < favoriteRecipes.length ? `page=${page + 1}` : null,
        previous: page > 1 ? `page=${page - 1}` : null,
        results: paginatedResults
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
      // First verify the recipe exists
      const recipe = await this.apiService.get<Recipe>(`/recipes/${recipeId}/`).toPromise();
      if (!recipe) {
        throw new Error('Recipe not found');
      }

      // Add to local favorites
      if (!this.favoritesCache.includes(recipeId)) {
        this.favoritesCache.push(recipeId);
        this.saveFavoritesToStorage();
        this.favoriteRecipesSubject.next([...this.favoritesCache]);
      }

      return {
        id: recipeId,
        recipe: recipe,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(recipeId: string): Promise<void> {
    try {
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
    return this.favoritesCache.includes(recipeId);
  }

  // Local storage management
  private loadFavoritesFromStorage(): void {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      const storageKey = `favorites_${currentUser.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        this.favoritesCache = JSON.parse(stored);
        this.favoriteRecipesSubject.next([...this.favoritesCache]);
      }
    } catch (error) {
      console.error('Failed to load favorites from storage:', error);
      this.favoritesCache = [];
    }
  }

  private saveFavoritesToStorage(): void {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      const storageKey = `favorites_${currentUser.id}`;
      localStorage.setItem(storageKey, JSON.stringify(this.favoritesCache));
    } catch (error) {
      console.error('Failed to save favorites to storage:', error);
    }
  }

  private removeFromFavoritesLocal(recipeId: string): void {
    const index = this.favoritesCache.indexOf(recipeId);
    if (index > -1) {
      this.favoritesCache.splice(index, 1);
      this.saveFavoritesToStorage();
      this.favoriteRecipesSubject.next([...this.favoritesCache]);
    }
  }

  // Get favorite count for dashboard
  getFavoriteCount(): number {
    return this.favoritesCache.length;
  }

  // Observable methods for reactive programming
  getFavoriteRecipesObservable(params?: any): Observable<PaginatedResponse<Recipe>> {
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
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const storageKey = `favorites_${currentUser.id}`;
      localStorage.removeItem(storageKey);
    }
  }
}