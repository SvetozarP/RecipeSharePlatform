import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';
import { PlatformStatistics, ModerationQueue, RecentActivity } from '../../models/admin.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <div class="admin-dashboard">
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading admin dashboard...</p>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!loading" class="dashboard-content">
        <!-- Welcome Section -->
        <div class="welcome-section">
          <mat-card class="welcome-card">
            <div class="welcome-content">
              <div class="welcome-text">
                <h2>Admin Dashboard</h2>
                <p>Platform overview and management tools</p>
              </div>
              <div class="welcome-actions">
                <button 
                  mat-raised-button 
                  color="primary" 
                  (click)="navigateTo('users')">
                  <mat-icon>people</mat-icon>
                  Manage Users
                </button>
              </div>
            </div>
          </mat-card>
        </div>

        <!-- Statistics Cards -->
        <div class="stats-section">
          <div class="stats-grid">
            <!-- Total Users -->
            <mat-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>people</mat-icon>
                </div>
                <div class="stat-info">
                  <h3 class="stat-value">{{ statistics?.users?.total || 0 }}</h3>
                  <p class="stat-label">Total Users</p>
                </div>
              </div>
            </mat-card>

            <!-- Total Recipes -->
            <mat-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>restaurant</mat-icon>
                </div>
                <div class="stat-info">
                  <h3 class="stat-value">{{ statistics?.recipes?.total || 0 }}</h3>
                  <p class="stat-label">Total Recipes</p>
                </div>
              </div>
            </mat-card>

            <!-- Total Ratings -->
            <mat-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>star</mat-icon>
                </div>
                <div class="stat-info">
                  <h3 class="stat-value">{{ statistics?.ratings?.total || 0 }}</h3>
                  <p class="stat-label">Total Ratings</p>
                </div>
              </div>
            </mat-card>

            <!-- Total Views -->
            <mat-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>visibility</mat-icon>
                </div>
                <div class="stat-info">
                  <h3 class="stat-value">{{ statistics?.engagement?.total_views || 0 }}</h3>
                  <p class="stat-label">Total Views</p>
                </div>
              </div>
            </mat-card>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="main-content">
          <!-- Moderation Queue -->
          <div class="moderation-section">
            <mat-card class="moderation-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>gavel</mat-icon>
                  Moderation Queue
                </mat-card-title>
                <button 
                  mat-button 
                  (click)="navigateTo('recipes')"
                  class="view-all-btn">
                  View All
                </button>
              </mat-card-header>
              <mat-card-content>
                <div class="moderation-grid">
                  <!-- Recipes Pending -->
                  <div class="moderation-item" 
                       [class.has-pending]="hasPendingRecipes"
                       (click)="navigateToModeration('recipes')">
                    <div class="moderation-icon">
                      <mat-icon>restaurant</mat-icon>
                    </div>
                    <div class="moderation-info">
                      <h4 class="moderation-value">{{ pendingRecipesCount }}</h4>
                      <p class="moderation-label">Recipes Pending</p>
                      <mat-chip *ngIf="hasFlaggedRecipes" 
                               color="warn" 
                               variant="outlined"
                               class="flag-chip">
                        {{ flaggedRecipesCount }} flagged
                      </mat-chip>
                    </div>
                  </div>

                  <!-- Ratings Pending -->
                  <div class="moderation-item"
                       [class.has-pending]="hasPendingRatings"
                       (click)="navigateToModeration('content')">
                    <div class="moderation-icon">
                      <mat-icon>rate_review</mat-icon>
                    </div>
                    <div class="moderation-info">
                      <h4 class="moderation-value">{{ pendingRatingsCount }}</h4>
                      <p class="moderation-label">Ratings Pending</p>
                      <mat-chip *ngIf="hasFlaggedRatings" 
                               color="warn" 
                               variant="outlined"
                               class="flag-chip">
                        {{ flaggedRatingsCount }} flagged
                      </mat-chip>
                    </div>
                  </div>

                  <!-- Users Pending -->
                  <div class="moderation-item"
                       [class.has-pending]="hasPendingUsers"
                       (click)="navigateToModeration('users')">
                    <div class="moderation-icon">
                      <mat-icon>person_add</mat-icon>
                    </div>
                    <div class="moderation-info">
                      <h4 class="moderation-value">{{ pendingUsersCount }}</h4>
                      <p class="moderation-label">Users Pending</p>
                      <mat-chip *ngIf="hasFlaggedUsers" 
                               color="warn" 
                               variant="outlined"
                               class="flag-chip">
                        {{ flaggedUsersCount }} flagged
                      </mat-chip>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Recent Activity -->
          <div class="activity-section">
            <mat-card class="activity-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>history</mat-icon>
                  Recent Activity
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div *ngIf="recentActivity.length > 0" class="activity-list">
                  <div 
                    *ngFor="let activity of recentActivity.slice(0, 5)" 
                    class="activity-item">
                    <div class="activity-icon">
                      <mat-icon>{{ activity.icon }}</mat-icon>
                    </div>
                    <div class="activity-content">
                      <p class="activity-text">{{ activity.message }}</p>
                      <span class="activity-time">{{ activity.time_ago }}</span>
                    </div>
                  </div>
                </div>
                <div *ngIf="recentActivity.length === 0" class="no-activity">
                  <p>No recent activity</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button 
            mat-raised-button 
            color="primary" 
            class="action-button"
            (click)="navigateTo('users')">
            <mat-icon>people</mat-icon>
            Manage Users
          </button>
          <button 
            mat-raised-button 
            color="accent" 
            class="action-button"
            (click)="navigateTo('recipes')">
            <mat-icon>restaurant</mat-icon>
            Moderate Recipes
          </button>
          <button 
            mat-raised-button 
            color="warn" 
            class="action-button"
            (click)="navigateTo('content')">
            <mat-icon>rate_review</mat-icon>
            Review Content
          </button>
          <button 
            mat-raised-button 
            class="action-button"
            (click)="navigateTo('analytics')">
            <mat-icon>analytics</mat-icon>
            View Analytics
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      @apply w-full px-4 py-6;
    }

    /* Welcome Section */
    .welcome-section {
      @apply mb-8;
    }
    
    .welcome-card {
      @apply bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-sm;
    }
    
    .welcome-content {
      @apply flex flex-col md:flex-row items-center justify-between p-6;
    }
    
    .welcome-text {
      @apply text-center md:text-left mb-4 md:mb-0;
    }
    
    .welcome-text h2 {
      @apply text-2xl font-bold text-gray-900 mb-2;
    }
    
    .welcome-text p {
      @apply text-gray-600;
    }
    
    .welcome-actions {
      @apply flex-shrink-0;
    }

    /* Statistics Section */
    .stats-section {
      @apply mb-8;
    }
    
    .stats-grid {
      @apply grid grid-cols-2 md:grid-cols-4 gap-4;
    }
    
    .stat-card {
      @apply border-0 shadow-sm;
    }
    
    .stat-content {
      @apply flex items-center p-4;
    }
    
    .stat-icon {
      @apply flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4;
    }
    
    .stat-icon mat-icon {
      @apply text-blue-600 text-xl;
    }
    
    .stat-info {
      @apply flex-1;
    }
    
    .stat-value {
      @apply text-2xl font-bold text-gray-900 mb-1;
    }
    
    .stat-label {
      @apply text-sm text-gray-600;
    }

    /* Main Content Grid */
    .main-content {
      @apply grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8;
    }

    /* Moderation Section */
    .moderation-card {
      @apply border-0 shadow-sm;
    }
    
    .moderation-card mat-card-header {
      @apply pb-4;
    }
    
    .moderation-card mat-card-title {
      @apply flex items-center text-lg font-semibold text-gray-900;
    }
    
    .moderation-card mat-card-title mat-icon {
      @apply mr-2 text-orange-600;
    }
    
    .view-all-btn {
      @apply ml-auto;
    }
    
    .moderation-grid {
      @apply space-y-4;
    }
    
    .moderation-item {
      @apply flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer;
    }
    
    .moderation-item.has-pending {
      @apply bg-red-50 border-l-4 border-red-500;
    }
    
    .moderation-icon {
      @apply flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center;
    }
    
    .moderation-icon mat-icon {
      @apply text-gray-600 text-lg;
    }
    
    .moderation-info {
      @apply flex-1;
    }
    
    .moderation-value {
      @apply text-xl font-bold text-gray-900 mb-1;
    }
    
    .moderation-label {
      @apply text-sm text-gray-600 mb-2;
    }
    
    .flag-chip {
      @apply text-xs;
    }

    /* Activity Section */
    .activity-card {
      @apply border-0 shadow-sm;
    }
    
    .activity-card mat-card-header {
      @apply pb-4;
    }
    
    .activity-card mat-card-title {
      @apply flex items-center text-lg font-semibold text-gray-900;
    }
    
    .activity-card mat-card-title mat-icon {
      @apply mr-2 text-blue-600;
    }
    
    .activity-list {
      @apply space-y-4;
    }
    
    .activity-item {
      @apply flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors;
    }
    
    .activity-icon {
      @apply flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center;
    }
    
    .activity-icon mat-icon {
      @apply text-blue-600 text-sm;
    }
    
    .activity-content {
      @apply flex-1 min-w-0;
    }
    
    .activity-text {
      @apply text-sm text-gray-900 mb-1;
    }
    
    .activity-time {
      @apply text-xs text-gray-500;
    }
    
    .no-activity {
      @apply text-center py-8 text-gray-500;
    }
    
    .no-activity p {
      @apply text-gray-600;
    }

    /* Quick Actions */
    .quick-actions {
      @apply flex flex-wrap justify-center gap-3;
    }
    
    .action-button {
      @apply min-w-[140px];
    }
    
    .action-button mat-icon {
      @apply mr-2;
    }

    /* Loading Container */
    .loading-container {
      @apply flex flex-col items-center justify-center py-16;
    }
    
    .loading-container p {
      @apply mt-4 text-gray-600;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .stats-grid {
        @apply grid-cols-2;
      }
      
      .main-content {
        @apply grid-cols-1;
      }
      
      .quick-actions {
        @apply flex-col items-center;
      }
      
      .quick-actions .action-button {
        @apply w-full max-w-xs;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  statistics?: PlatformStatistics;
  moderationQueue?: ModerationQueue;
  recentActivity: Array<RecentActivity> = [];

  // Getter methods for safe access to moderation queue counts
  get pendingRecipesCount(): number {
    return this.moderationQueue?.recipes?.pending || 0;
  }

  get flaggedRecipesCount(): number {
    return this.moderationQueue?.recipes?.flagged || 0;
  }

  get pendingRatingsCount(): number {
    return this.moderationQueue?.ratings?.pending || 0;
  }

  get flaggedRatingsCount(): number {
    return this.moderationQueue?.ratings?.flagged || 0;
  }

  get pendingUsersCount(): number {
    return this.moderationQueue?.users?.pending_verification || 0;
  }

  get flaggedUsersCount(): number {
    return this.moderationQueue?.users?.flagged || 0;
  }

  get hasPendingRecipes(): boolean {
    return this.pendingRecipesCount > 0;
  }

  get hasPendingRatings(): boolean {
    return this.pendingRatingsCount > 0;
  }

  get hasPendingUsers(): boolean {
    return this.pendingUsersCount > 0;
  }

  get hasFlaggedRecipes(): boolean {
    return this.flaggedRecipesCount > 0;
  }

  get hasFlaggedRatings(): boolean {
    return this.flaggedRatingsCount > 0;
  }

  get hasFlaggedUsers(): boolean {
    return this.flaggedUsersCount > 0;
  }

  constructor(
    private adminService: AdminService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading = true;

    // Load platform statistics
    this.adminService.getPlatformStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (error) => {
        console.error('Failed to load platform statistics:', error);
        this.snackBar.open('Failed to load platform statistics', 'Close', {
          duration: 5000
        });
      }
    });

    // Load moderation queue
    this.adminService.getModerationQueue().subscribe({
      next: (queue) => {
        this.moderationQueue = queue;
      },
      error: (error) => {
        console.error('Failed to load moderation queue:', error);
        this.snackBar.open('Failed to load moderation queue', 'Close', {
          duration: 5000
        });
      },
      complete: () => {
        this.loading = false;
        this.loadRecentActivity();
      }
    });
  }

  private loadRecentActivity(): void {
    this.adminService.getRecentActivity().subscribe({
      next: (activities) => {
        this.recentActivity = activities;
      },
      error: (error) => {
        console.error('Failed to load recent activity:', error);
        this.snackBar.open('Failed to load recent activity', 'Close', {
          duration: 5000
        });
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([`/admin/${route}`]);
  }

  navigateToModeration(type: string): void {
    switch (type) {
      case 'recipes':
        this.router.navigate(['/admin/recipes']);
        break;
      case 'content':
        this.router.navigate(['/admin/content']);
        break;
      case 'users':
        this.router.navigate(['/admin/users']);
        break;
    }
  }
} 