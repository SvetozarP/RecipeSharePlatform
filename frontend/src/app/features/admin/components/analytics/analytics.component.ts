import { Component, OnInit } from '@angular/core';
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
import { AdminService } from '../../services/admin.service';
import { AnalyticsData } from '../../models/admin.models';

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
    MatDividerModule
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
              <div class="chart-placeholder">
                <mat-icon>show_chart</mat-icon>
                <p>User growth chart would be displayed here</p>
                <small>Data points: {{ analyticsData?.user_growth?.labels?.length || 0 }}</small>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Recipe Activity">
            <div class="chart-container">
              <h3>Recipe Creation Activity</h3>
              <div class="chart-placeholder">
                <mat-icon>show_chart</mat-icon>
                <p>Recipe activity chart would be displayed here</p>
                <small>Data points: {{ analyticsData?.recipe_activity?.labels?.length || 0 }}</small>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Category Distribution">
            <div class="chart-container">
              <h3>Recipes by Category</h3>
              <div class="chart-placeholder">
                <mat-icon>pie_chart</mat-icon>
                <p>Category distribution pie chart would be displayed here</p>
                <small>Categories: {{ analyticsData?.category_distribution?.labels?.length || 0 }}</small>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Rating Distribution">
            <div class="chart-container">
              <h3>Rating Distribution</h3>
              <div class="chart-placeholder">
                <mat-icon>bar_chart</mat-icon>
                <p>Rating distribution bar chart would be displayed here</p>
                <small>Rating levels: {{ analyticsData?.rating_distribution?.labels?.length || 0 }}</small>
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
      max-width: 1400px;
      margin: 0 auto;
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
    }

    .chart-container {
      padding: 24px;
    }

    .chart-container h3 {
      margin: 0 0 16px 0;
      color: #333;
    }

    .chart-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      background-color: #f5f5f5;
      border-radius: 8px;
      border: 2px dashed #ddd;
    }

    .chart-placeholder mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #999;
      margin-bottom: 16px;
    }

    .chart-placeholder p {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 1.1rem;
    }

    .chart-placeholder small {
      color: #999;
    }

    .performers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 16px;
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