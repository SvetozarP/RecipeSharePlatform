import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { 
  CategoryStats, 
  DifficultyStats 
} from '../models/user-statistics.model';
import { UserStatistics } from '../models/dashboard-data.model';
import { RecipeStats } from '../models/dashboard-data.model';

@Injectable({
  providedIn: 'root'
})
export class UserStatisticsService {
  private statsUpdatesSubject = new BehaviorSubject<UserStatistics | null>(null);
  public statsUpdates$ = this.statsUpdatesSubject.asObservable();

  constructor(private apiService: ApiService) {}

  async getUserStatistics(): Promise<UserStatistics> {
    try {
      const stats = await this.apiService.get<UserStatistics>('/dashboard/statistics/').toPromise();
      if (!stats) {
        throw new Error('No user statistics received');
      }
      this.statsUpdatesSubject.next(stats);
      return stats;
    } catch (error) {
      console.error('Failed to load user statistics:', error);
      throw error;
    }
  }

  async getRecipeStatistics(): Promise<RecipeStats> {
    try {
      const result = await this.apiService.get<RecipeStats>('/dashboard/statistics/recipes/').toPromise();
      if (!result) {
        throw new Error('No recipe statistics received');
      }
      return result;
    } catch (error) {
      console.error('Failed to load recipe statistics:', error);
      throw error;
    }
  }



  async getCategoryBreakdown(timeRange: string): Promise<CategoryStats[]> {
    try {
      const params = this.apiService.buildParams({ time_range: timeRange });
      const result = await this.apiService.get<CategoryStats[]>('/dashboard/statistics/categories/', params).toPromise();
      if (!result) {
        throw new Error('No category breakdown received');
      }
      return result;
    } catch (error) {
      console.error('Failed to load category breakdown:', error);
      throw error;
    }
  }

  async getDifficultyBreakdown(timeRange: string): Promise<DifficultyStats[]> {
    try {
      const params = this.apiService.buildParams({ time_range: timeRange });
      const result = await this.apiService.get<DifficultyStats[]>('/dashboard/statistics/difficulty/', params).toPromise();
      if (!result) {
        throw new Error('No difficulty breakdown received');
      }
      return result;
    } catch (error) {
      console.error('Failed to load difficulty breakdown:', error);
      throw error;
    }
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