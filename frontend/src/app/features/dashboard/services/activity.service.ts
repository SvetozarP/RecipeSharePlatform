import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Activity } from '../models/dashboard-data.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private activityUpdatesSubject = new BehaviorSubject<Activity | null>(null);
  public activityUpdates$ = this.activityUpdatesSubject.asObservable();

  constructor(private apiService: ApiService) {}

  async getRecentActivity(limit: number = 10): Promise<Activity[]> {
    try {
      const params = this.apiService.buildParams({ limit });
      const result = await this.apiService.get<Activity[]>('/dashboard/activity/recent/', params).toPromise();
      if (!result) {
        throw new Error('No activity data received');
      }
      return result;
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      throw error;
    }
  }

  async getUserActivity(params?: any): Promise<Activity[]> {
    try {
      const queryParams = params ? this.apiService.buildParams(params) : undefined;
      const result = await this.apiService.get<Activity[]>('/dashboard/activity/', queryParams).toPromise();
      if (!result) {
        throw new Error('No user activity data received');
      }
      return result;
    } catch (error) {
      console.error('Failed to load user activity:', error);
      throw error;
    }
  }

  async logActivity(activity: Partial<Activity>): Promise<Activity> {
    try {
      const result = await this.apiService.post<Activity>('/dashboard/activity/', activity).toPromise();
      if (!result) {
        throw new Error('No activity result received');
      }
      return result;
    } catch (error) {
      console.error('Failed to log activity:', error);
      throw error;
    }
  }

  // Observable methods
  getRecentActivityObservable(limit: number = 10): Observable<Activity[]> {
    const params = this.apiService.buildParams({ limit });
    return this.apiService.get<Activity[]>('/dashboard/activity/recent/', params);
  }

  getUserActivityObservable(params?: any): Observable<Activity[]> {
    const queryParams = params ? this.apiService.buildParams(params) : undefined;
    return this.apiService.get<Activity[]>('/dashboard/activity/', queryParams);
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
}