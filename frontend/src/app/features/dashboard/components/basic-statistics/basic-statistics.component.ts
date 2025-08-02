import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material.module';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { CookingStatsPipe } from '../../pipes/cooking-stats.pipe';

import { UserStatisticsService } from '../../services/user-statistics.service';
import { UserStatistics, RecipeStats } from '../../models/dashboard-data.model';
import { CategoryStats, DifficultyStats, Achievement, Insight } from '../../models/user-statistics.model';

@Component({
  selector: 'app-basic-statistics',
  standalone: true,
  imports: [
    CommonModule, 
    MaterialModule, 
    LoadingComponent,
    CookingStatsPipe
  ],
  templateUrl: './basic-statistics.component.html',
  styleUrls: ['./basic-statistics.component.scss']
})
export class BasicStatisticsComponent implements OnInit {
  userStats: UserStatistics | null = null;
  recipeStats: RecipeStats | null = null;
  categoryBreakdown: CategoryStats[] = [];
  difficultyBreakdown: DifficultyStats[] = [];
  
  isLoading = false;
  selectedTimeRange = 'all';
  
  timeRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '6m', label: 'Last 6 Months' },
    { value: '3m', label: 'Last 3 Months' },
    { value: '1m', label: 'Last Month' }
  ];
  
  constructor(private userStatsService: UserStatisticsService) {}
  
  async ngOnInit(): Promise<void> {
    await this.loadStatistics();
  }
  
  private async loadStatistics(): Promise<void> {
    this.isLoading = true;
    
    try {
      const [
        userStats,
        recipeStats,
        categoryBreakdown,
        difficultyBreakdown
      ] = await Promise.all([
        this.userStatsService.getUserStatistics().catch(() => this.getMockUserStats()),
        this.userStatsService.getRecipeStatistics().catch(() => this.getMockRecipeStats()),
        this.userStatsService.getCategoryBreakdown(this.selectedTimeRange).catch(() => this.getMockCategoryBreakdown()),
        this.userStatsService.getDifficultyBreakdown(this.selectedTimeRange).catch(() => this.getMockDifficultyBreakdown())
      ]);
      
      this.userStats = userStats;
      this.recipeStats = recipeStats;
      this.categoryBreakdown = categoryBreakdown;
      this.difficultyBreakdown = difficultyBreakdown;
      
    } catch (error) {
      console.error('Failed to load statistics:', error);
      // Use mock data as fallback
      this.userStats = this.getMockUserStats();
      this.recipeStats = this.getMockRecipeStats();
      this.categoryBreakdown = this.getMockCategoryBreakdown();
      this.difficultyBreakdown = this.getMockDifficultyBreakdown();
    } finally {
      this.isLoading = false;
    }
  }

  // Mock data methods for when API is not available
  private getMockUserStats(): UserStatistics {
    return {
      total_recipes: 12,
      published_recipes: 10,
      draft_recipes: 2,
      private_recipes: 0,
      total_favorites: 25,
      total_views: 234,
      total_ratings: 18,
      average_rating: 4.3,
      total_comments: 7,
      first_recipe_date: '2024-01-15',
      last_activity_date: new Date().toISOString(),
      most_used_category: 'Desserts',
      preferred_difficulty: 'medium'
    };
  }

  private getMockRecipeStats(): RecipeStats {
    return {
      total_recipes: 12,
      published_recipes: 10,
      draft_recipes: 2,
      private_recipes: 0,
      total_views: 234,
      total_ratings: 18,
      average_rating: 4.3,
      most_viewed_recipe: {
        id: '1',
        title: 'Chocolate Chip Cookies',
        description: 'Classic homemade cookies',
        slug: 'chocolate-chip-cookies',
        images: [],
        categories: [],
        author: { id: '1', username: 'user', first_name: 'John', last_name: 'Doe' },
        rating_stats: { average_rating: 4.8, total_ratings: 12, rating_distribution: { 5: 8, 4: 3, 3: 1, 2: 0, 1: 0 } },
        ingredients: [],
        instructions: [],
        prep_time: 15,
        cook_time: 12,
        total_time: 27,
        servings: 24,
        difficulty: 'easy',
        cooking_method: 'baking',
        tags: [],
        is_published: true,
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      highest_rated_recipe: {
        id: '2',
        title: 'Perfect Pasta Carbonara',
        description: 'Authentic Italian carbonara',
        slug: 'perfect-pasta-carbonara',
        images: [],
        categories: [],
        author: { id: '1', username: 'user', first_name: 'John', last_name: 'Doe' },
        rating_stats: { average_rating: 4.9, total_ratings: 8, rating_distribution: { 5: 7, 4: 1, 3: 0, 2: 0, 1: 0 } },
        ingredients: [],
        instructions: [],
        prep_time: 10,
        cook_time: 15,
        total_time: 25,
        servings: 4,
        difficulty: 'medium',
        cooking_method: 'stovetop',
        tags: [],
        is_published: true,
        created_at: '2024-02-10',
        updated_at: '2024-02-10'
      }
    };
  }

  private getMockCategoryBreakdown(): CategoryStats[] {
    return [
      { category_name: 'Desserts', recipe_count: 5, percentage: 41.67 },
      { category_name: 'Main Dishes', recipe_count: 4, percentage: 33.33 },
      { category_name: 'Appetizers', recipe_count: 2, percentage: 16.67 },
      { category_name: 'Beverages', recipe_count: 1, percentage: 8.33 }
    ];
  }

  private getMockDifficultyBreakdown(): DifficultyStats[] {
    return [
      { difficulty: 'easy', recipe_count: 6, percentage: 50.00 },
      { difficulty: 'medium', recipe_count: 5, percentage: 41.67 },
      { difficulty: 'hard', recipe_count: 1, percentage: 8.33 }
    ];
  }
  
  onTimeRangeChange(): void {
    this.loadStatistics();
  }
  
  getAchievements(): Achievement[] {
    if (!this.userStats) return [];
    
    const achievements: Achievement[] = [];
    
    // Recipe milestone achievements
    if (this.userStats.total_recipes >= 1) {
      achievements.push({
        id: 'first_recipe',
        title: 'First Recipe',
        description: 'Created your first recipe',
        icon: 'star',
        unlocked: true,
        unlockedDate: this.userStats.first_recipe_date
      });
    }
    
    if (this.userStats.total_recipes >= 5) {
      achievements.push({
        id: 'recipe_creator',
        title: 'Recipe Creator',
        description: 'Created 5 recipes',
        icon: 'restaurant',
        unlocked: true
      });
    }
    
    if (this.userStats.total_recipes >= 10) {
      achievements.push({
        id: 'recipe_enthusiast',
        title: 'Recipe Enthusiast',
        description: 'Created 10 recipes',
        icon: 'bookmark',
        unlocked: true
      });
    }
    
    if (this.userStats.total_recipes >= 25) {
      achievements.push({
        id: 'recipe_master',
        title: 'Recipe Master',
        description: 'Created 25 recipes',
        icon: 'emoji_events',
        unlocked: this.userStats.total_recipes >= 25
      });
    }
    
    // Rating achievements
    if (this.userStats.average_rating >= 4.0) {
      achievements.push({
        id: 'highly_rated',
        title: 'Highly Rated Chef',
        description: 'Maintain 4.0+ star average rating',
        icon: 'grade',
        unlocked: true
      });
    }
    
    if (this.userStats.average_rating >= 4.5) {
      achievements.push({
        id: 'excellent_chef',
        title: 'Excellent Chef',
        description: 'Maintain 4.5+ star average rating',
        icon: 'military_tech',
        unlocked: true
      });
    }
    
    // View achievements
    if (this.userStats.total_views >= 100) {
      achievements.push({
        id: 'popular_recipes',
        title: 'Popular Recipes',
        description: 'Your recipes have been viewed 100+ times',
        icon: 'visibility',
        unlocked: true
      });
    }
    
    return achievements;
  }
  
  getCookingInsights(): Insight[] {
    if (!this.userStats) return [];
    
    const insights: Insight[] = [];
    
    // Most popular category
    if (this.categoryBreakdown.length > 0) {
      const topCategory = this.categoryBreakdown[0];
      insights.push({
        type: 'category',
        title: 'Favorite Category',
        description: `You create ${topCategory.category_name} recipes most often`,
        value: topCategory.recipe_count,
        icon: 'favorite'
      });
    }
    
    // Recipe difficulty preference
    if (this.difficultyBreakdown.length > 0) {
      const topDifficulty = this.difficultyBreakdown[0];
      insights.push({
        type: 'difficulty',
        title: 'Preferred Difficulty',
        description: `You enjoy ${topDifficulty.difficulty} recipes the most`,
        value: topDifficulty.recipe_count,
        icon: 'trending_up'
      });
    }
    
    // Recipe publishing rate
    if (this.userStats.total_recipes > 0) {
      const publishedRate = Math.round((this.userStats.published_recipes / this.userStats.total_recipes) * 100);
      insights.push({
        type: 'publishing',
        title: 'Publishing Rate',
        description: `You publish ${publishedRate}% of your recipes`,
        value: publishedRate,
        icon: 'publish'
      });
    }
    
    // Community engagement
    if (this.userStats.total_ratings > 0) {
      insights.push({
        type: 'engagement',
        title: 'Community Engagement',
        description: `Your recipes have received ${this.userStats.total_ratings} ratings`,
        value: this.userStats.total_ratings,
        icon: 'people'
      });
    }
    
    return insights;
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getCategoryColor(index: number): string {
    const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-pink-600'];
    return colors[index % colors.length];
  }

  async refreshStatistics(): Promise<void> {
    await this.loadStatistics();
  }
}