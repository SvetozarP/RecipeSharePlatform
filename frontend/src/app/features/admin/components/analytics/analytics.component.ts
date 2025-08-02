import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AdminService } from '../../services/admin.service';
import { AnalyticsData } from '../../models/admin.models';

// Register Chart.js plugins
import { registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTabsModule,
    MatDividerModule,
    NgChartsModule
  ],
  template: `
    <div class="analytics">
      <div class="page-header">
        <h1>Analytics & Reporting</h1>
        <p>Platform insights, trends, and performance metrics</p>
      </div>

      <!-- Period Selector -->
      <mat-card class="period-selector">
        <mat-card-content>
          <form [formGroup]="periodForm" (ngSubmit)="updatePeriod()">
            <div class="period-controls">
              <mat-form-field appearance="fill">
                <mat-label>Time Period</mat-label>
                <mat-select formControlName="period">
                  <mat-option value="7d">Last 7 Days</mat-option>
                  <mat-option value="30d">Last 30 Days</mat-option>
                  <mat-option value="90d">Last 90 Days</mat-option>
                  <mat-option value="1y">Last Year</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit">
                <mat-icon>refresh</mat-icon>
                Update
              </button>
              <button mat-stroked-button type="button" (click)="refreshCharts()">
                <mat-icon>sync</mat-icon>
                Refresh Charts
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading analytics data...</p>
      </div>

      <!-- Analytics Content -->
      <div *ngIf="!loading" class="analytics-content">
        <!-- Key Metrics -->
        <div class="metrics-section">
          <h2>Key Metrics</h2>
          <div class="metrics-grid">
            <mat-card class="metric-card">
              <mat-card-content>
                <div class="metric-icon">
                  <mat-icon>trending_up</mat-icon>
                </div>
                <div class="metric-content">
                  <h3>{{ totalUsers }}</h3>
                  <p>Total Users</p>
                  <small>+{{ getGrowthRate(userGrowthData) }}% from last period</small>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="metric-card">
              <mat-card-content>
                <div class="metric-icon">
                  <mat-icon>restaurant</mat-icon>
                </div>
                <div class="metric-content">
                  <h3>{{ totalRecipes }}</h3>
                  <p>Total Recipes</p>
                  <small>+{{ getGrowthRate(recipeActivityData) }}% from last period</small>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="metric-card">
              <mat-card-content>
                <div class="metric-icon">
                  <mat-icon>star</mat-icon>
                </div>
                <div class="metric-content">
                  <h3>{{ totalRatings }}</h3>
                  <p>Total Ratings</p>
                  <small>Average: {{ getAverageRating(ratingDistributionData) }}/5</small>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="metric-card">
              <mat-card-content>
                <div class="metric-icon">
                  <mat-icon>visibility</mat-icon>
                </div>
                <div class="metric-content">
                  <h3>{{ getTotalViews(topRecipes) }}</h3>
                  <p>Total Views</p>
                  <small>Across all recipes</small>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>

        <!-- Charts Section -->
        <mat-tab-group class="charts-section">
          <mat-tab label="User Growth">
            <div class="chart-container">
              <h3>User Growth Over Time</h3>
              <div class="chart-wrapper">
                <canvas baseChart
                  [data]="userGrowthChartData"
                  [options]="userGrowthChartOptions"
                  [type]="userGrowthChartType">
                </canvas>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Recipe Activity">
            <div class="chart-container">
              <h3>Recipe Creation Activity</h3>
              <div class="chart-wrapper">
                <canvas baseChart
                  [data]="recipeActivityChartData"
                  [options]="recipeActivityChartOptions"
                  [type]="recipeActivityChartType">
                </canvas>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Category Distribution">
            <div class="chart-container">
              <h3>Recipes by Category</h3>
              <div class="chart-wrapper">
                <canvas baseChart
                  [data]="categoryDistributionChartData"
                  [options]="categoryDistributionChartOptions"
                  [type]="categoryDistributionChartType">
                </canvas>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Rating Distribution">
            <div class="chart-container">
              <h3>Rating Distribution</h3>
              <div class="chart-wrapper">
                <canvas baseChart
                  [data]="ratingDistributionChartData"
                  [options]="ratingDistributionChartOptions"
                  [type]="ratingDistributionChartType">
                </canvas>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>

        <!-- Top Performers -->
        <div class="top-performers-section">
          <h2>Top Performers</h2>
          
          <div class="performers-grid">
            <!-- Top Recipes -->
            <mat-card class="performer-card">
              <mat-card-header>
                <mat-card-title>Top Recipes</mat-card-title>
                <mat-card-subtitle>Most viewed and favorited</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="performer-list">
                  <div *ngFor="let recipe of topRecipes?.slice(0, 5); let i = index" class="performer-item">
                    <div class="rank">{{ i + 1 }}</div>
                    <div class="performer-info">
                      <div class="performer-name">{{ recipe.title }}</div>
                      <div class="performer-stats">
                        <span>{{ recipe.views }} views</span>
                        <span>{{ recipe.favorites }} favorites</span>
                        <span>{{ recipe.average_rating.toFixed(1) }} ⭐</span>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Top Categories -->
            <mat-card class="performer-card">
              <mat-card-header>
                <mat-card-title>Top Categories</mat-card-title>
                <mat-card-subtitle>Most popular categories</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="performer-list">
                  <div *ngFor="let category of analyticsData?.top_categories?.slice(0, 5); let i = index" class="performer-item">
                    <div class="rank">{{ i + 1 }}</div>
                    <div class="performer-info">
                      <div class="performer-name">{{ category.name }}</div>
                      <div class="performer-stats">
                        <span>{{ category.recipe_count }} recipes</span>
                        <span>{{ category.average_rating.toFixed(1) }} ⭐</span>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Top Users -->
            <mat-card class="performer-card">
              <mat-card-header>
                <mat-card-title>Top Users</mat-card-title>
                <mat-card-subtitle>Most active contributors</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="performer-list">
                  <div *ngFor="let user of analyticsData?.top_users?.slice(0, 5); let i = index" class="performer-item">
                    <div class="rank">{{ i + 1 }}</div>
                    <div class="performer-info">
                      <div class="performer-name">{{ user.username }}</div>
                      <div class="performer-stats">
                        <span>{{ user.recipe_count }} recipes</span>
                        <span>{{ user.total_views }} views</span>
                        <span>{{ user.average_rating.toFixed(1) }} ⭐</span>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>

        <!-- Export Section -->
        <div class="export-section">
          <h2>Export Reports</h2>
          <div class="export-actions">
            <button mat-raised-button color="primary" (click)="exportUserReport()">
              <mat-icon>download</mat-icon>
              Export User Report
            </button>
            <button mat-raised-button color="accent" (click)="exportRecipeReport()">
              <mat-icon>download</mat-icon>
              Export Recipe Report
            </button>
            <button mat-raised-button color="warn" (click)="exportEngagementReport()">
              <mat-icon>download</mat-icon>
              Export Engagement Report
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics {
      width: 100%;
      max-width: none;
      margin: 0;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 2rem;
    }

    .page-header p {
      margin: 0;
      color: #666;
    }

    .period-selector {
      margin-bottom: 24px;
    }

    .period-controls {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .analytics-content {
      display: flex;
      flex-direction: column;
      gap: 32px;
      width: 100%;
    }

    .metrics-section h2,
    .top-performers-section h2,
    .export-section h2 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 1.5rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      width: 100%;
    }

    .metric-card {
      height: 120px;
    }

    .metric-card mat-card-content {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 16px;
    }

    .metric-icon {
      margin-right: 16px;
    }

    .metric-icon mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #1976d2;
    }

    .metric-content h3 {
      margin: 0 0 4px 0;
      font-size: 1.8rem;
      font-weight: 600;
      color: #333;
    }

    .metric-content p {
      margin: 0 0 4px 0;
      color: #666;
    }

    .metric-content small {
      color: #999;
      font-size: 0.8rem;
    }

    .charts-section {
      margin-bottom: 32px;
      width: 100%;
    }

    .chart-container {
      padding: 24px;
      width: 100%;
    }

    .chart-container h3 {
      margin: 0 0 16px 0;
      color: #333;
    }

    .chart-wrapper {
      position: relative;
      height: 400px;
      width: 100%;
      background-color: white;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      padding: 16px;
    }

    .chart-wrapper canvas {
      width: 100% !important;
      height: 100% !important;
    }

    .performers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 16px;
      width: 100%;
    }

    .performer-card {
      height: 400px;
    }

    .performer-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .performer-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }

    .rank {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .performer-info {
      flex: 1;
    }

    .performer-name {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .performer-stats {
      display: flex;
      gap: 12px;
      font-size: 0.8rem;
      color: #666;
    }

    .export-section {
      margin-top: 32px;
      width: 100%;
    }

    .export-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    @media (max-width: 768px) {
      .period-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .performers-grid {
        grid-template-columns: 1fr;
      }

      .export-actions {
        flex-direction: column;
      }
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  loading = false;
  analyticsData?: AnalyticsData;
  periodForm: FormGroup;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  // Chart configurations
  userGrowthChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Total Users',
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#1976d2',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
    }]
  };
  userGrowthChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#1976d2',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category',
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#666'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#666',
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };
  userGrowthChartType: ChartType = 'line';

  recipeActivityChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Total Recipes',
      borderColor: '#4caf50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#4caf50',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
    }]
  };
  recipeActivityChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#4caf50',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category',
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#666'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#666',
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };
  recipeActivityChartType: ChartType = 'line';

  categoryDistributionChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Recipes',
      backgroundColor: [
        '#42a5f5', '#ec407a', '#ab47bc', '#7e57c2', '#4db6ac',
        '#ffca28', '#ffee58', '#ff8a65', '#a1887f', '#90a4ae',
        '#26a69a', '#ef5350', '#ff7043', '#8d6e63', '#78909c'
      ],
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverBorderColor: '#ffffff',
      hoverBorderWidth: 3,
    }]
  };
  categoryDistributionChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };
  categoryDistributionChartType: ChartType = 'doughnut';

  ratingDistributionChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Ratings',
      backgroundColor: [
        '#f44336', '#ff9800', '#ffc107', '#8bc34a', '#4caf50'
      ],
      borderColor: '#ffffff',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }]
  };
  ratingDistributionChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ff9800',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#666'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#666',
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    }
  };
  ratingDistributionChartType: ChartType = 'bar';

  // Getter methods for safe access to analytics data
  get totalUsers(): number {
    const data = this.analyticsData?.user_growth?.datasets?.[0]?.data;
    return data && data.length > 0 ? data[data.length - 1] : 0;
  }

  get totalRecipes(): number {
    const data = this.analyticsData?.recipe_activity?.datasets?.[0]?.data;
    return data && data.length > 0 ? data[data.length - 1] : 0;
  }

  get totalRatings(): number {
    const data = this.analyticsData?.rating_distribution?.datasets?.[0]?.data;
    return data ? data.reduce((sum, count) => sum + count, 0) : 0;
  }

  get userGrowthData(): number[] | undefined {
    return this.analyticsData?.user_growth?.datasets?.[0]?.data;
  }

  get recipeActivityData(): number[] | undefined {
    return this.analyticsData?.recipe_activity?.datasets?.[0]?.data;
  }

  get ratingDistributionData(): number[] | undefined {
    return this.analyticsData?.rating_distribution?.datasets?.[0]?.data;
  }

  get topRecipes(): Array<{
    id: string;
    title: string;
    views: number;
    favorites: number;
    average_rating: number;
  }> | undefined {
    return this.analyticsData?.top_recipes;
  }

  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.periodForm = this.formBuilder.group({
      period: ['30d']
    });
  }

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  private loadAnalyticsData(): void {
    this.loading = true;
    const period = this.periodForm.get('period')?.value || '30d';

    this.adminService.getAnalyticsData(period).subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.updateCharts();
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load analytics data:', error);
        this.snackBar.open('Failed to load analytics data', 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }

  updatePeriod(): void {
    this.loadAnalyticsData();
  }

  refreshCharts(): void {
    this.updateCharts();
    this.snackBar.open('Charts refreshed successfully', 'Close', {
      duration: 2000
    });
  }

  private updateCharts(): void {
    // Update User Growth Chart
    if (this.analyticsData?.user_growth) {
      this.userGrowthChartData.labels = this.analyticsData.user_growth.labels || [];
      this.userGrowthChartData.datasets[0].data = this.analyticsData.user_growth.datasets[0]?.data || [];
    }

    // Update Recipe Activity Chart
    if (this.analyticsData?.recipe_activity) {
      this.recipeActivityChartData.labels = this.analyticsData.recipe_activity.labels || [];
      this.recipeActivityChartData.datasets[0].data = this.analyticsData.recipe_activity.datasets[0]?.data || [];
    }

    // Update Rating Distribution Chart
    if (this.analyticsData?.rating_distribution) {
      this.ratingDistributionChartData.labels = this.analyticsData.rating_distribution.labels || [];
      this.ratingDistributionChartData.datasets[0].data = this.analyticsData.rating_distribution.datasets[0]?.data || [];
    }

    // Update Category Distribution Chart
    if (this.analyticsData?.category_distribution) {
      this.categoryDistributionChartData.labels = this.analyticsData.category_distribution.labels || [];
      this.categoryDistributionChartData.datasets[0].data = this.analyticsData.category_distribution.datasets[0]?.data || [];
    }

    // Force chart update
    if (this.chart) {
      this.chart.update();
    }
  }

  // Helper methods for calculations
  getGrowthRate(data?: number[]): number {
    if (!data || data.length < 2) return 0;
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  }

  getAverageRating(data?: number[]): number {
    if (!data || data.length === 0) return 0;
    const total = data.reduce((sum, count, index) => sum + (count * (index + 1)), 0);
    const count = data.reduce((sum, count) => sum + count, 0);
    return count > 0 ? Math.round((total / count) * 10) / 10 : 0;
  }

  getTotalViews(recipes?: Array<{ views: number }>): number {
    if (!recipes) return 0;
    return recipes.reduce((sum, recipe) => sum + recipe.views, 0);
  }

  // Export methods
  exportUserReport(): void {
    this.adminService.exportData('users', 'csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user_report.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('User report exported successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Failed to export user report:', error);
        this.snackBar.open('Failed to export user report', 'Close', {
          duration: 5000
        });
      }
    });
  }

  exportRecipeReport(): void {
    this.adminService.exportData('recipes', 'csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recipe_report.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Recipe report exported successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Failed to export recipe report:', error);
        this.snackBar.open('Failed to export recipe report', 'Close', {
          duration: 5000
        });
      }
    });
  }

  exportEngagementReport(): void {
    this.adminService.exportData('ratings', 'csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'engagement_report.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Engagement report exported successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Failed to export engagement report:', error);
        this.snackBar.open('Failed to export engagement report', 'Close', {
          duration: 5000
        });
      }
    });
  }
} 