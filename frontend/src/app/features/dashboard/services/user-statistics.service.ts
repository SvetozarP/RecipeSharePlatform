import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { 
  CategoryStats, 
  DifficultyStats 
} from '../models/user-statistics.model';
import { UserStatistics } from '../models/dashboard-data.model';
import { RecipeStats } from '../models/dashboard-data.model';
import { Recipe } from '../../../shared/models/recipe.models';

@Injectable({
  providedIn: 'root'
})
export class UserStatisticsService {
  private statsUpdatesSubject = new BehaviorSubject<UserStatistics | null>(null);
  public statsUpdates$ = this.statsUpdatesSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  async getUserStatistics(): Promise<UserStatistics> {
    try {
      const userRecipes = await this.getUserRecipes();
      const stats = this.calculateUserStatistics(userRecipes);
      this.statsUpdatesSubject.next(stats);
      return stats;
    } catch (error) {
      console.error('Failed to load user statistics:', error);
      const defaultStats = this.getDefaultStatistics();
      this.statsUpdatesSubject.next(defaultStats);
      return defaultStats;
    }
  }

  async getRecipeStatistics(): Promise<RecipeStats> {
    try {
      const userRecipes = await this.getUserRecipes();
      return this.calculateRecipeStats(userRecipes);
    } catch (error) {
      console.error('Failed to load recipe statistics:', error);
      return {
        total_recipes: 0,
        published_recipes: 0,
        draft_recipes: 0,
        private_recipes: 0,
        total_views: 0,
        total_ratings: 0,
        average_rating: 0,
        most_viewed_recipe: {} as Recipe,
        highest_rated_recipe: {} as Recipe
      };
    }
  }

  async getCategoryBreakdown(timeRange: string): Promise<CategoryStats[]> {
    try {
      const userRecipes = await this.getUserRecipes();
      return this.calculateCategoryStats(userRecipes, timeRange);
    } catch (error) {
      console.error('Failed to load category breakdown:', error);
      return [];
    }
  }

  async getDifficultyBreakdown(timeRange: string): Promise<DifficultyStats[]> {
    try {
      const userRecipes = await this.getUserRecipes();
      return this.calculateDifficultyStats(userRecipes, timeRange);
    } catch (error) {
      console.error('Failed to load difficulty breakdown:', error);
      return [];
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

  private calculateRecipeStats(userRecipes: Recipe[]): RecipeStats {
    const totalRecipes = userRecipes.length;
    
    // Calculate average rating
    const ratingsSum = userRecipes.reduce((sum, recipe) => {
      return sum + (recipe.rating_stats?.average_rating || 0);
    }, 0);
    const averageRating = totalRecipes > 0 ? ratingsSum / totalRecipes : 0;

    // Find most viewed and highest rated recipes
    const mostViewedRecipe = userRecipes.length > 0 ? userRecipes[0] : {} as Recipe;
    const highestRatedRecipe = userRecipes.length > 0 
      ? userRecipes.reduce((prev, current) => 
          (current.rating_stats?.average_rating || 0) > (prev.rating_stats?.average_rating || 0) ? current : prev
        )
      : {} as Recipe;

    return {
      total_recipes: totalRecipes,
      published_recipes: totalRecipes, // Assume all retrieved are published
      draft_recipes: 0,
      private_recipes: 0,
      total_views: 0, // Not available in current Recipe interface
      total_ratings: userRecipes.reduce((sum, recipe) => sum + (recipe.rating_stats?.total_ratings || 0), 0),
      average_rating: parseFloat(averageRating.toFixed(2)),
      most_viewed_recipe: mostViewedRecipe,
      highest_rated_recipe: highestRatedRecipe
    };
  }

  private calculateCategoryStats(userRecipes: Recipe[], timeRange: string): CategoryStats[] {
    // Filter recipes by time range if needed
    const filteredRecipes = this.filterRecipesByTimeRange(userRecipes, timeRange);
    
    // Count recipes by category
    const categoryCounts: { [key: string]: number } = {};
    filteredRecipes.forEach(recipe => {
      if (recipe.categories && recipe.categories.length > 0) {
        recipe.categories.forEach(category => {
          const categoryName = typeof category === 'string' ? category : category.name;
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        });
      } else {
        categoryCounts['Uncategorized'] = (categoryCounts['Uncategorized'] || 0) + 1;
      }
    });

    // Convert to CategoryStats array
    return Object.entries(categoryCounts).map(([name, count]) => ({
      category_name: name,
      recipe_count: count,
      percentage: filteredRecipes.length > 0 ? Math.round(((count / filteredRecipes.length) * 100) * 100) / 100 : 0
    }));
  }

  private calculateDifficultyStats(userRecipes: Recipe[], timeRange: string): DifficultyStats[] {
    // Filter recipes by time range if needed
    const filteredRecipes = this.filterRecipesByTimeRange(userRecipes, timeRange);
    
    // Count recipes by difficulty
    const difficultyCounts: { [key: string]: number } = {};
    filteredRecipes.forEach(recipe => {
      const difficulty = recipe.difficulty || 'Medium';
      difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;
    });

    // Convert to DifficultyStats array
    return Object.entries(difficultyCounts).map(([difficulty, count]) => ({
      difficulty: difficulty,
      recipe_count: count,
      percentage: filteredRecipes.length > 0 ? Math.round(((count / filteredRecipes.length) * 100) * 100) / 100 : 0
    }));
  }

  private filterRecipesByTimeRange(recipes: Recipe[], timeRange: string): Recipe[] {
    if (timeRange === 'all') return recipes;

    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return recipes;
    }

    return recipes.filter(recipe => {
      const recipeDate = new Date(recipe.created_at);
      return recipeDate >= cutoffDate;
    });
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

  // Update stats cache
  updateStats(stats: UserStatistics): void {
    this.statsUpdatesSubject.next(stats);
  }

  // Clear cached stats
  clearStats(): void {
    this.statsUpdatesSubject.next(null);
  }
}