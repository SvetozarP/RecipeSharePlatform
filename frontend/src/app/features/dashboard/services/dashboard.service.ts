import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardData, DashboardSummary, UserStatistics, Activity } from '../models/dashboard-data.model';
import { Recipe } from '../../../shared/models/recipe.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private dashboardDataSubject = new BehaviorSubject<DashboardData | null>(null);
  public dashboardData$ = this.dashboardDataSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  async getDashboardData(): Promise<DashboardData> {
    try {
      // Aggregate data from existing endpoints
      const [userRecipes, allRecipes] = await Promise.all([
        this.getUserRecipes(),
        this.getRecommendedRecipes()
      ]);

      const currentUser = this.authService.getCurrentUser();
      
      // Create dashboard data from available information
      const dashboardData: DashboardData = {
        summary: await this.getDashboardSummary(),
        recent_activity: this.generateMockActivity(),
        favorite_recipes: [], // Will be populated by FavoritesService
        recommended_recipes: allRecipes.slice(0, 6),

        user_stats: this.calculateUserStatistics(userRecipes)
      };

      this.dashboardDataSubject.next(dashboardData);
      return dashboardData;
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Return default data structure to prevent crashes
      const defaultData: DashboardData = {
        summary: {
          total_recipes: 0,
          total_favorites: 0,
          recent_activity_count: 0,
          new_recommendations: 0
        },
        recent_activity: [],
        favorite_recipes: [],
        recommended_recipes: [],

        user_stats: this.getDefaultStatistics()
      };
      this.dashboardDataSubject.next(defaultData);
      return defaultData;
    }
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const userRecipes = await this.getUserRecipes();
      const stats = this.calculateUserStatistics(userRecipes);
      
      return {
        total_recipes: stats.total_recipes,
        total_favorites: 0, // Will be updated by components

        recent_activity_count: 1,
        new_recommendations: 6
      };
    } catch (error) {
      console.error('Failed to load dashboard summary:', error);
      return {
        total_recipes: 0,
        total_favorites: 0,
        recent_activity_count: 0,
        new_recommendations: 0
      };
    }
  }

  async refreshDashboardData(): Promise<void> {
    try {
      // Simply reload the dashboard data
      await this.getDashboardData();
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
      throw error;
    }
  }

  // Helper methods
  private async getUserRecipes(): Promise<Recipe[]> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return [];
      
      const params = this.apiService.buildParams({ author: currentUser.id });
      const response = await this.apiService.get<any>('/recipes/', params).toPromise();
      return response?.results || [];
    } catch (error) {
      console.error('Failed to load user recipes:', error);
      return [];
    }
  }

  private async getRecommendedRecipes(): Promise<Recipe[]> {
    try {
      const params = this.apiService.buildParams({ 
        page_size: 10,
        ordering: '-created_at'
      });
      const response = await this.apiService.get<any>('/recipes/', params).toPromise();
      return response?.results || [];
    } catch (error) {
      console.error('Failed to load recommended recipes:', error);
      return [];
    }
  }

  private calculateUserStatistics(userRecipes: Recipe[]): UserStatistics {
    const totalRecipes = userRecipes.length;
    
    // Calculate average rating
    const ratingsSum = userRecipes.reduce((sum, recipe) => {
      return sum + (recipe.rating_stats?.average_rating || 0);
    }, 0);
    const averageRating = totalRecipes > 0 ? ratingsSum / totalRecipes : 0;

    return {
      total_recipes: totalRecipes,
      published_recipes: totalRecipes, // Assume all retrieved are published
      draft_recipes: 0,
      private_recipes: 0,
      total_favorites: 0, // Will be updated by components
      total_views: 0, // Not available in current Recipe interface
      total_ratings: userRecipes.reduce((sum, recipe) => sum + (recipe.rating_stats?.total_ratings || 0), 0),
      average_rating: averageRating,
      total_comments: 0, // Not available in current Recipe interface
      first_recipe_date: userRecipes.length > 0 ? userRecipes[userRecipes.length - 1].created_at : new Date().toISOString(),
      last_activity_date: userRecipes.length > 0 ? userRecipes[0].updated_at : new Date().toISOString(),
      most_used_category: userRecipes.length > 0 && userRecipes[0].categories.length > 0 ? userRecipes[0].categories[0].name : 'None',
      preferred_difficulty: userRecipes.length > 0 ? userRecipes[0].difficulty : 'medium'
    };
  }

  private generateMockActivity(): Activity[] {
    // Generate some recent activity items
    const activities: Activity[] = [];
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      activities.push({
        id: 1,
        type: 'recipe_created',
        description: 'Welcome to your Recipe Dashboard!',
        created_at: new Date().toISOString(),
        user: currentUser.username
      });
    }

    return activities;
  }

  private generateInsights(userRecipes: Recipe[]): any[] {
    const insights = [];
    
    if (userRecipes.length === 0) {
      insights.push({
        type: 'suggestion',
        title: 'Start Your Culinary Journey',
        description: 'Create your first recipe to begin tracking your cooking statistics!'
      });
    } else {
      insights.push({
        type: 'achievement',
        title: 'Recipe Creator',
        description: `You've created ${userRecipes.length} recipe${userRecipes.length !== 1 ? 's' : ''}!`
      });
    }

    return insights;
  }

  private generateAchievements(userRecipes: Recipe[]): any[] {
    const achievements = [];
    
    if (userRecipes.length >= 1) {
      achievements.push({
        id: 'first_recipe',
        title: 'First Recipe',
        description: 'Created your first recipe',
        icon: 'restaurant',
        earned_at: new Date().toISOString()
      });
    }

    if (userRecipes.length >= 5) {
      achievements.push({
        id: 'recipe_enthusiast',
        title: 'Recipe Enthusiast',
        description: 'Created 5 recipes',
        icon: 'star',
        earned_at: new Date().toISOString()
      });
    }

    return achievements;
  }

  private getDefaultStatistics(): UserStatistics {
    return {
      total_recipes: 0,
      published_recipes: 0,
      draft_recipes: 0,
      private_recipes: 0,
      total_favorites: 0,
      total_views: 0,
      total_ratings: 0,
      average_rating: 0,
      total_comments: 0,
      first_recipe_date: new Date().toISOString(),
      last_activity_date: new Date().toISOString(),
      most_used_category: 'None',
      preferred_difficulty: 'medium'
    };
  }

  // Clear cached data
  clearCache(): void {
    this.dashboardDataSubject.next(null);
  }
}