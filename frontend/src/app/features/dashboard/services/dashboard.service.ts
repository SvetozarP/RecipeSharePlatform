import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DashboardData, DashboardSummary } from '../models/dashboard-data.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private dashboardDataSubject = new BehaviorSubject<DashboardData | null>(null);
  public dashboardData$ = this.dashboardDataSubject.asObservable();

  constructor(private apiService: ApiService) {}

  async getDashboardData(): Promise<DashboardData> {
    try {
      const data = await this.apiService.get<DashboardData>('/dashboard/').toPromise();
      if (!data) {
        throw new Error('No dashboard data received');
      }
      this.dashboardDataSubject.next(data);
      return data;
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      throw error;
    }
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const data = await this.apiService.get<DashboardSummary>('/dashboard/summary/').toPromise();
      if (!data) {
        throw new Error('No dashboard summary received');
      }
      return data;
    } catch (error) {
      console.error('Failed to load dashboard summary:', error);
      throw error;
    }
  }

  async refreshDashboardData(): Promise<void> {
    try {
      await this.apiService.post<void>('/dashboard/refresh/', {}).toPromise();
      // Reload dashboard data after refresh
      await this.getDashboardData();
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
      throw error;
    }
  }

  // Clear cached data
  clearCache(): void {
    this.dashboardDataSubject.next(null);
  }
}