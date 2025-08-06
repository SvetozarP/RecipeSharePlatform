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
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
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