import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Recipe } from '../../../shared/models/recipe.models';

export interface RecipeView {
  id: string;
  recipe: Recipe;
  user_email?: string;
  ip_address?: string;
  view_duration_seconds?: number;
  created_at: string;
}

export interface ViewStats {
  total_views: number;
  unique_views: number;
  average_view_duration?: number;
  most_viewed_recipes: Recipe[];
}

export interface RecipeViewParams {
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface RecipeViewStats {
  total_views: number;
  unique_views: number;
  average_view_duration?: number;
  most_viewed_recipes: Recipe[];
}

@Injectable({
  providedIn: 'root'
})
export class RecipeViewsService {
  private apiService = inject(ApiService);

  /**
   * Record a recipe view
   */
  async recordView(recipeId: string, durationSeconds?: number): Promise<RecipeView> {
    try {
      const data: { recipe_id: string; view_duration_seconds?: number } = { recipe_id: recipeId };
      if (durationSeconds) {
        data.view_duration_seconds = durationSeconds;
      }
      
      const response = await firstValueFrom(this.apiService.post<RecipeView>('/recipes/views/', data));
      if (!response) {
        throw new Error('Failed to record recipe view: No response received');
      }
      return response;
    } catch (error) {
      console.error('Failed to record recipe view:', error);
      throw error;
    }
  }

  /**
   * Get user's recipe views
   */
  async getUserViews(params?: RecipeViewParams): Promise<RecipeView[]> {
    try {
      const response = await firstValueFrom(this.apiService.get<RecipeView[]>('/recipes/views/my_views/', { params }));
      return response || [];
    } catch (error) {
      console.error('Failed to get user views:', error);
      return [];
    }
  }

  /**
   * Get view statistics for a specific recipe
   */
  async getRecipeViewStats(recipeId: string): Promise<RecipeViewStats | null> {
    try {
      const response = await firstValueFrom(this.apiService.get<RecipeViewStats>(`/recipes/views/recipe_stats/?recipe_id=${recipeId}`));
      return response || null;
    } catch (error) {
      console.error('Failed to get recipe view stats:', error);
      return null;
    }
  }

  /**
   * Get user's view statistics (views made by the user)
   */
  async getUserViewStats(): Promise<ViewStats> {
    try {
      const response = await firstValueFrom(this.apiService.get<ViewStats>('/recipes/views/user_stats/'));
      return response || {
        total_views: 0,
        unique_views: 0,
        average_view_duration: 0,
        most_viewed_recipes: []
      };
    } catch (error) {
      console.error('Failed to get user view stats:', error);
      return {
        total_views: 0,
        unique_views: 0,
        average_view_duration: 0,
        most_viewed_recipes: []
      };
    }
  }

  /**
   * Get author's view statistics (views of recipes created by the user)
   */
  async getAuthorViewStats(): Promise<ViewStats> {
    try {
      const response = await firstValueFrom(this.apiService.get<ViewStats>('/recipes/views/author_stats/'));
      return response || {
        total_views: 0,
        unique_views: 0,
        average_view_duration: 0,
        most_viewed_recipes: []
      };
    } catch (error) {
      console.error('Failed to get author view stats:', error);
      return {
        total_views: 0,
        unique_views: 0,
        average_view_duration: 0,
        most_viewed_recipes: []
      };
    }
  }

  /**
   * Observable methods for reactive programming
   */
  recordViewObservable(recipeId: string, durationSeconds?: number): Observable<RecipeView> {
    return new Observable(observer => {
      this.recordView(recipeId, durationSeconds).then(result => {
        observer.next(result);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  getUserViewsObservable(params?: RecipeViewParams): Observable<RecipeView[]> {
    return new Observable(observer => {
      this.getUserViews(params).then(result => {
        observer.next(result);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  getUserViewStatsObservable(): Observable<ViewStats> {
    return new Observable(observer => {
      this.getUserViewStats().then(result => {
        observer.next(result);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }
} 