import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, interval, takeUntil } from 'rxjs';

import { AdminService } from '../../services/admin.service';

interface PerformanceMetrics {
  system: {
    cpu_average: number;
    memory_average: number;
    disk_average: number;
    current: any;
  };
  database: {
    queries_per_minute: number;
    average_query_time: number;
    slow_queries: number;
    current: any;
  };
  cache: {
    hit_rate: number;
    current: any;
  };
  requests: {
    average_response_time: number;
    slow_requests: number;
  };
  summary: any;
  timestamp: string;
}

interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  memory_available: number;
  memory_total: number;
  disk_free: number;
  disk_total: number;
}

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './performance-dashboard.component.html',
  styleUrls: ['./performance-dashboard.component.scss']})
export class PerformanceDashboardComponent implements OnInit, OnDestroy {
  metrics: PerformanceMetrics | null = null;
  systemStats: SystemStats | null = null;
  slowQueries: any[] = [];
  loading = false;
  slowQueryColumns = ['sql', 'duration', 'timestamp'];

  private destroy$ = new Subject<void>();
  private refreshInterval: any;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadMetrics();
    
    // Auto-refresh every 30 seconds
    this.refreshInterval = interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadMetrics();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
    }
  }

  loadMetrics() {
    this.loading = true;
    
    // Load performance metrics
    this.adminService.getPerformanceMetrics().subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.systemStats = metrics.system.current;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load performance metrics:', error);
        this.loading = false;
        this.snackBar.open('Failed to load performance metrics', 'Close', { duration: 3000 });
      }
    });

    // Load slow queries
    this.adminService.getSlowQueries().subscribe({
      next: (response) => {
        this.slowQueries = response.slow_queries || [];
      },
      error: (error) => {
        console.error('Failed to load slow queries:', error);
      }
    });
  }

  refreshMetrics() {
    this.loadMetrics();
  }

  clearCache() {
    this.loading = true;
    
    this.adminService.clearCache().subscribe({
      next: () => {
        this.snackBar.open('Cache cleared successfully', 'Close', { duration: 3000 });
        this.loading = false;
        this.loadMetrics(); // Refresh metrics after clearing cache
      },
      error: (error) => {
        console.error('Failed to clear cache:', error);
        this.snackBar.open('Failed to clear cache', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  exportMetrics() {
    this.adminService.exportMetrics().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance_metrics_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Metrics exported successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Failed to export metrics:', error);
        this.snackBar.open('Failed to export metrics', 'Close', { duration: 3000 });
      }
    });
  }

  getProgressColor(value: number): string {
    if (value >= 90) return 'warn';
    if (value >= 70) return 'accent';
    return 'primary';
  }

  getCacheColor(value: number): string {
    if (value >= 80) return 'primary';
    if (value >= 60) return 'accent';
    return 'warn';
  }

  getHealthColor(): string {
    if (!this.metrics) return 'primary';
    
    const cpu = this.systemStats?.cpu_percent || 0;
    const memory = this.systemStats?.memory_percent || 0;
    const disk = this.systemStats?.disk_percent || 0;
    
    if (cpu > 90 || memory > 90 || disk > 95) return 'warn';
    if (cpu > 80 || memory > 85 || disk > 90) return 'accent';
    return 'primary';
  }

  getHealthStatus(): string {
    if (!this.metrics) return 'Unknown';
    
    const cpu = this.systemStats?.cpu_percent || 0;
    const memory = this.systemStats?.memory_percent || 0;
    const disk = this.systemStats?.disk_percent || 0;
    
    if (cpu > 90 || memory > 90 || disk > 95) return 'Critical';
    if (cpu > 80 || memory > 85 || disk > 90) return 'Warning';
    return 'Healthy';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return 'Unknown';
    
    return new Date(timestamp).toLocaleString();
  }
} 