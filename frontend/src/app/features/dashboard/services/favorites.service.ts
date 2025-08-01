import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Recipe, PaginatedResponse } from '../../../shared/models/recipe.models';

export interface Favorite {
  id: number;
  recipe: Recipe;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  constructor(private apiService: ApiService) {}

  async getFavoriteRecipes(params?: any): Promise<PaginatedResponse<Recipe>> {
    try {
      const queryParams = params ? this.apiService.buildParams(params) : undefined;
      const result = await this.apiService.get<PaginatedResponse<Recipe>>('/dashboard/favorites/', queryParams).toPromise();
      if (!result) {
        throw new Error('No favorite recipes data received');
      }
      return result;
    } catch (error) {
      console.error('Failed to load favorite recipes:', error);
      throw error;
    }
  }

  async addToFavorites(recipeId: number): Promise<Favorite> {
    try {
      const result = await this.apiService.post<Favorite>('/dashboard/favorites/', { recipe_id: recipeId }).toPromise();
      if (!result) {
        throw new Error('No favorite result received');
      }
      return result;
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(recipeId: number): Promise<void> {
    try {
      await this.apiService.delete<void>(`/dashboard/favorites/${recipeId}/`).toPromise();
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      throw error;
    }
  }

  async bulkRemoveFromFavorites(recipeIds: number[]): Promise<void> {
    try {
      await this.apiService.post<void>('/dashboard/favorites/bulk-remove/', { recipe_ids: recipeIds }).toPromise();
    } catch (error) {
      console.error('Failed to bulk remove from favorites:', error);
      throw error;
    }
  }

  async isFavorite(recipeId: number): Promise<boolean> {
    try {
      await this.apiService.get(`/dashboard/favorites/${recipeId}/`).toPromise();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Observable methods for reactive programming
  getFavoriteRecipesObservable(params?: any): Observable<PaginatedResponse<Recipe>> {
    const queryParams = params ? this.apiService.buildParams(params) : undefined;
    return this.apiService.get<PaginatedResponse<Recipe>>('/dashboard/favorites/', queryParams);
  }

  addToFavoritesObservable(recipeId: number): Observable<Favorite> {
    return this.apiService.post<Favorite>('/dashboard/favorites/', { recipe_id: recipeId });
  }

  removeFromFavoritesObservable(recipeId: number): Observable<void> {
    return this.apiService.delete<void>(`/dashboard/favorites/${recipeId}/`);
  }
}