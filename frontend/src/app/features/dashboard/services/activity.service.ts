import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Activity } from '../models/dashboard-data.model';
import { Recipe } from '../../../shared/models/recipe.models';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private activityUpdatesSubject = new BehaviorSubject<Activity | null>(null);
  public activityUpdates$ = this.activityUpdatesSubject.asObservable();
  private activityCache: Activity[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  async getRecentActivity(limit = 10): Promise<Activity[]> {
    try {
      // Generate activity from user's recipes and actions
      const activities = await this.generateActivityFromRecipes();
      return activities.slice(0, limit);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      return this.getDefaultActivity();
    }
  }

  async getUserActivity(params?: any): Promise<Activity[]> {
    try {
      // Generate activity from user's recipes and actions
      const activities = await this.generateActivityFromRecipes();
      
      // Apply any filtering if needed
      let filteredActivities = activities;
      if (params?.type) {
        filteredActivities = activities.filter(activity => activity.type === params.type);
      }

      return filteredActivities;
    } catch (error) {
      console.error('Failed to load user activity:', error);
      return [];
    }
  }

  async logActivity(activity: Partial<Activity>): Promise<Activity> {
    try {
      const currentUser = this.authService.getCurrentUser();
      const newActivity: Activity = {
        id: Date.now(),
        type: activity.type || 'recipe_created',
        description: activity.description || 'Activity logged',
        created_at: new Date().toISOString(),
        user: currentUser?.username || 'User',
        recipe: activity.recipe
      };

      // Add to cache and emit
      this.activityCache.unshift(newActivity);
      this.emitActivity(newActivity);
      
      return newActivity;
    } catch (error) {
      console.error('Failed to log activity:', error);
      throw error;
    }
  }

  // Generate activity based on user's recipes
  private async generateActivityFromRecipes(): Promise<Activity[]> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return this.getDefaultActivity();

      const params = this.apiService.buildParams({ author: currentUser.id });
      const response = await this.apiService.get<any>('/recipes/', params).toPromise();
      const userRecipes: Recipe[] = response?.results || [];

      const activities: Activity[] = [];

      // Generate activity from recipes
      userRecipes.forEach((recipe, index) => {
        // Recipe creation activity
        activities.push({
          id: parseInt(recipe.id.replace(/[^0-9]/g, '').slice(-6)) + 1000,
          type: 'recipe_created',
          description: `Created recipe "${recipe.title}"`,
          created_at: recipe.created_at,
          user: currentUser.username,
          recipe: recipe
        });

        // Recipe published activity (always assume published for retrieved recipes)
        activities.push({
          id: parseInt(recipe.id.replace(/[^0-9]/g, '').slice(-6)) + 2000,
          type: 'recipe_published',
          description: `Published recipe "${recipe.title}"`,
          created_at: recipe.updated_at || recipe.created_at,
          user: currentUser.username,
          recipe: recipe
        });

        // Add some mock rating activities for variety
        if (recipe.rating_stats && recipe.rating_stats.average_rating > 0) {
          activities.push({
            id: parseInt(recipe.id.replace(/[^0-9]/g, '').slice(-6)) + 3000,
            type: 'rating_given',
            description: `Received a ${recipe.rating_stats.average_rating.toFixed(1)} star rating on "${recipe.title}"`,
            created_at: recipe.updated_at || recipe.created_at,
            user: currentUser.username,
            recipe: recipe
          });
        }
      });

      // Add some welcome activities for new users
      if (activities.length === 0) {
        activities.push({
          id: 1,
          type: 'recipe_created',
          description: 'Welcome to your Recipe Dashboard! Start by creating your first recipe.',
          created_at: new Date().toISOString(),
          user: currentUser.username
        });
      }

      // Sort by date (newest first)
      return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Failed to generate activity from recipes:', error);
      return this.getDefaultActivity();
    }
  }

  private getDefaultActivity(): Activity[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];

    return [
      {
        id: 1,
        type: 'recipe_created',
        description: 'Welcome to your Recipe Dashboard!',
        created_at: new Date().toISOString(),
        user: currentUser.username
      }
    ];
  }

  // Observable methods
  getRecentActivityObservable(limit = 10): Observable<Activity[]> {
    return new Observable(observer => {
      this.getRecentActivity(limit).then(activities => {
        observer.next(activities);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  getUserActivityObservable(params?: any): Observable<Activity[]> {
    return new Observable(observer => {
      this.getUserActivity(params).then(activities => {
        observer.next(activities);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  // Emit new activity for real-time updates
  emitActivity(activity: Activity): void {
    this.activityUpdatesSubject.next(activity);
  }

  // Helper methods for activity icons and formatting
  getActivityIcon(activityType: string): string {
    switch (activityType) {
      case 'recipe_created':
        return 'restaurant';
      case 'recipe_published':
        return 'publish';
      case 'comment_added':
        return 'comment';
      case 'rating_given':
        return 'star';
      case 'favorite_added':
        return 'favorite';
      case 'collection_created':
        return 'folder';
      default:
        return 'activity';
    }
  }

  getActivityColor(activityType: string): string {
    switch (activityType) {
      case 'recipe_created':
      case 'recipe_published':
        return 'blue';
      case 'comment_added':
        return 'green';
      case 'rating_given':
        return 'yellow';
      case 'favorite_added':
        return 'red';
      case 'collection_created':
        return 'purple';
      default:
        return 'gray';
    }
  }

  // Clear activity cache
  clearCache(): void {
    this.activityCache = [];
  }
}