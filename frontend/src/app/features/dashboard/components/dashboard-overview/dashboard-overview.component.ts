import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/material.module';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';

import { DashboardService } from '../../services/dashboard.service';
import { UserStatisticsService } from '../../services/user-statistics.service';
import { ActivityService } from '../../services/activity.service';
import { FavoritesService } from '../../services/favorites.service';
import { CollectionsService } from '../../services/collections.service';

import { DashboardData, UserStatistics, Activity, Collection } from '../../models/dashboard-data.model';
import { Recipe } from '../../../../shared/models/recipe.models';
import { AuthService } from '../../../../core/services/auth.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule, 
    MaterialModule, 
    StarRatingComponent, 
    LoadingComponent
  ],
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.scss']
})
export class DashboardOverviewComponent implements OnInit, OnDestroy {
  userStats: UserStatistics | null = null;
  recentActivity: Activity[] = [];
  favoriteRecipes: Recipe[] = [];
  recommendedRecipes: Recipe[] = [];
  collections: Collection[] = [];
  
  isLoading = true;
  dashboardData: DashboardData | null = null;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private dashboardService: DashboardService,
    private userStatsService: UserStatisticsService,
    private activityService: ActivityService,
    private favoritesService: FavoritesService,
    private collectionsService: CollectionsService,
    public authService: AuthService,
    private router: Router
  ) {}
  
  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
    this.subscribeToRealTimeUpdates();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private async loadDashboardData(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Load all dashboard data in parallel
      const [
        userStats,
        recentActivity,
        favoriteRecipes,
        collections
      ] = await Promise.all([
        this.userStatsService.getUserStatistics().catch(() => ({
          total_recipes: 0,
          published_recipes: 0,
          draft_recipes: 0,
          private_recipes: 0,
          total_favorites: 0,
          total_views: 0,
          total_ratings: 0,
          average_rating: 0,
          total_comments: 0,
          first_recipe_date: '',
          last_activity_date: '',
          cooking_streak_current: 0,
          cooking_streak_longest: 0,
          average_cook_time: 0,
          most_used_category: '',
          preferred_difficulty: ''
        })),
        this.activityService.getRecentActivity(10).catch(() => []),
        this.favoritesService.getFavoriteRecipes({ page_size: 6 }).then(response => response.results).catch(() => []),
        this.collectionsService.getUserCollections(5).catch(() => [])
      ]);
      
      this.userStats = userStats;
      this.recentActivity = recentActivity;
      this.favoriteRecipes = favoriteRecipes;
      this.collections = collections;
      
      // Mock recommended recipes for now (will be replaced with actual API)
      this.recommendedRecipes = [];
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  private subscribeToRealTimeUpdates(): void {
    // Subscribe to activity updates
    this.activityService.activityUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(newActivity => {
        if (newActivity) {
          this.recentActivity.unshift(newActivity);
          if (this.recentActivity.length > 10) {
            this.recentActivity = this.recentActivity.slice(0, 10);
          }
        }
      });
    
    // Subscribe to stats updates
    this.userStatsService.statsUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedStats => {
        if (updatedStats) {
          this.userStats = updatedStats;
        }
      });
  }
  
  onQuickAction(action: string): void {
    switch (action) {
      case 'create-recipe':
        this.router.navigate(['/recipes/create']);
        break;
      case 'browse-recipes':
        this.router.navigate(['/recipes']);
        break;
      case 'view-favorites':
        this.router.navigate(['/dashboard/favorites']);
        break;
      case 'my-recipes':
        this.router.navigate(['/dashboard/recipes']);
        break;
      case 'statistics':
        this.router.navigate(['/dashboard/statistics']);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }
  
  onRecipeClick(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.id]);
  }
  
  onCollectionClick(collection: Collection): void {
    this.router.navigate(['/dashboard/collections', collection.id]);
  }
  
  onViewAllActivity(): void {
    this.router.navigate(['/dashboard/activity']);
  }
  
  async refreshDashboard(): Promise<void> {
    await this.loadDashboardData();
  }

  getActivityIcon(activityType: string): string {
    return this.activityService.getActivityIcon(activityType);
  }

  getActivityColor(activityType: string): string {
    return this.activityService.getActivityColor(activityType);
  }

  formatActivityTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }

  get hasRecentActivity(): boolean {
    return this.recentActivity && this.recentActivity.length > 0;
  }

  get hasFavorites(): boolean {
    return this.favoriteRecipes && this.favoriteRecipes.length > 0;
  }

  get hasCollections(): boolean {
    return this.collections && this.collections.length > 0;
  }
}