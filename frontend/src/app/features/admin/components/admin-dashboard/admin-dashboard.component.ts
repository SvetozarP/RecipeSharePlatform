import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';
import { PlatformStatistics, ModerationQueue } from '../../models/admin.models';

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
    RouterLink,
  ],
  template: `
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and management tools</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading dashboard data...</p>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!loading" class="dashboard-content">
        <!-- Platform Statistics -->
        <div class="stats-section">
          <h2>Platform Statistics</h2>
          <mat-grid-list cols="3" rowHeight="120px" gutterSize="16px">
            <!-- Users Stats -->
            <mat-grid-tile>
              <mat-card class="stat-card users-card">
                <mat-card-content>
                  <div class="stat-icon">
                    <mat-icon>people</mat-icon>
                  </div>
                  <div class="stat-content">
                    <h3>{{ statistics?.users?.total || 0 }}</h3>
                    <p>Total Users</p>
                    <small>{{ statistics?.users?.new_this_month || 0 }} new this month</small>
                  </div>
                </mat-card-content>
              </mat-card>
            </mat-grid-tile>

            <!-- Recipes Stats -->
            <mat-grid-tile>
              <mat-card class="stat-card recipes-card">
                <mat-card-content>
                  <div class="stat-icon">
                    <mat-icon>restaurant</mat-icon>
                  </div>
                  <div class="stat-content">
                    <h3>{{ statistics?.recipes?.total || 0 }}</h3>
                    <p>Total Recipes</p>
                    <small>{{ statistics?.recipes?.published || 0 }} published</small>
                  </div>
                </mat-card-content>
              </mat-card>
            </mat-grid-tile>



            <!-- Ratings Stats -->
            <mat-grid-tile>
              <mat-card class="stat-card ratings-card">
                <mat-card-content>
                  <div class="stat-icon">
                    <mat-icon>star</mat-icon>
                  </div>
                  <div class="stat-content">
                    <h3>{{ statistics?.ratings?.total || 0 }}</h3>
                    <p>Total Ratings</p>
                    <small>Avg: {{ statistics?.ratings?.average_rating?.toFixed(1) || '0.0' }}</small>
                  </div>
                </mat-card-content>
              </mat-card>
            </mat-grid-tile>
          </mat-grid-list>
        </div>

        <!-- Moderation Queue -->
        <div class="moderation-section">
          <h2>Moderation Queue</h2>
          <mat-grid-list cols="3" rowHeight="100px" gutterSize="16px">
            <!-- Recipes Pending -->
            <mat-grid-tile>
              <mat-card class="moderation-card recipes-pending" 
                        [class.has-pending]="hasPendingRecipes"
                        (click)="navigateToModeration('recipes')">
                <mat-card-content>
                  <div class="moderation-icon">
                    <mat-icon>restaurant</mat-icon>
                  </div>
                  <div class="moderation-content">
                    <h3>{{ pendingRecipesCount }}</h3>
                    <p>Recipes Pending</p>
                    <mat-chip-set>
                      <mat-chip *ngIf="hasFlaggedRecipes" 
                               color="warn" variant="outlined">
                        {{ flaggedRecipesCount }} flagged
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </mat-card-content>
              </mat-card>
            </mat-grid-tile>

            <!-- Ratings Pending -->
            <mat-grid-tile>
              <mat-card class="moderation-card ratings-pending"
                        [class.has-pending]="hasPendingRatings"
                        (click)="navigateToModeration('content')">
                <mat-card-content>
                  <div class="moderation-icon">
                    <mat-icon>rate_review</mat-icon>
                  </div>
                  <div class="moderation-content">
                    <h3>{{ pendingRatingsCount }}</h3>
                    <p>Ratings Pending</p>
                    <mat-chip-set>
                      <mat-chip *ngIf="hasFlaggedRatings" 
                               color="warn" variant="outlined">
                        {{ flaggedRatingsCount }} flagged
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </mat-card-content>
              </mat-card>
            </mat-grid-tile>

            <!-- Users Pending -->
            <mat-grid-tile>
              <mat-card class="moderation-card users-pending"
                        [class.has-pending]="hasPendingUsers"
                        (click)="navigateToModeration('users')">
                <mat-card-content>
                  <div class="moderation-icon">
                    <mat-icon>person_add</mat-icon>
                  </div>
                  <div class="moderation-content">
                    <h3>{{ pendingUsersCount }}</h3>
                    <p>Users Pending</p>
                    <mat-chip-set>
                      <mat-chip *ngIf="hasFlaggedUsers" 
                               color="warn" variant="outlined">
                        {{ flaggedUsersCount }} flagged
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </mat-card-content>
              </mat-card>
            </mat-grid-tile>
          </mat-grid-list>
        </div>

        <!-- Quick Actions -->
        <div class="actions-section">
          <h2>Quick Actions</h2>
          <mat-grid-list cols="4" rowHeight="80px" gutterSize="16px">
            <mat-grid-tile>
              <button mat-raised-button color="primary" (click)="navigateTo('users')">
                <mat-icon>people</mat-icon>
                Manage Users
              </button>
            </mat-grid-tile>

            <mat-grid-tile>
              <button mat-raised-button color="accent" (click)="navigateTo('recipes')">
                <mat-icon>restaurant</mat-icon>
                Moderate Recipes
              </button>
            </mat-grid-tile>

            <mat-grid-tile>
              <button mat-raised-button color="warn" (click)="navigateTo('content')">
                <mat-icon>rate_review</mat-icon>
                Review Content
              </button>
            </mat-grid-tile>

            <mat-grid-tile>
              <button mat-raised-button (click)="navigateTo('analytics')">
                <mat-icon>analytics</mat-icon>
                View Analytics
              </button>
            </mat-grid-tile>
          </mat-grid-list>
        </div>

        <!-- Recent Activity -->
        <div class="activity-section">
          <h2>Recent Activity</h2>
          <mat-card>
            <mat-card-content>
              <div class="activity-item" *ngFor="let activity of recentActivity">
                <div class="activity-icon">
                  <mat-icon>{{ activity.icon }}</mat-icon>
                </div>
                <div class="activity-content">
                  <p>{{ activity.message }}</p>
                  <small>{{ activity.time }}</small>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 32px;
      text-align: center;
    }

    .dashboard-header h1 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 2rem;
    }

    .dashboard-header p {
      margin: 0;
      color: #666;
      font-size: 1.1rem;
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

    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .stats-section h2,
    .moderation-section h2,
    .actions-section h2,
    .activity-section h2 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 1.5rem;
    }

    .stat-card {
      width: 100%;
      height: 100%;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 16px;
    }

    .stat-icon {
      margin-right: 16px;
    }

    .stat-icon mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .stat-content h3 {
      margin: 0 0 4px 0;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .stat-content p {
      margin: 0 0 4px 0;
      color: #666;
    }

    .stat-content small {
      color: #999;
      font-size: 0.8rem;
    }

    .users-card .stat-icon mat-icon { color: #1976d2; }
    .recipes-card .stat-icon mat-icon { color: #388e3c; }
    .ratings-card .stat-icon mat-icon { color: #ffc107; }

    .moderation-card {
      width: 100%;
      height: 100%;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .moderation-card:hover {
      transform: translateY(-2px);
    }

    .moderation-card.has-pending {
      border: 2px solid #f44336;
      background-color: #ffebee;
    }

    .moderation-card mat-card-content {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 16px;
    }

    .moderation-icon {
      margin-right: 16px;
    }

    .moderation-icon mat-icon {
      font-size: 1.8rem;
      width: 1.8rem;
      height: 1.8rem;
      color: #666;
    }

    .moderation-content h3 {
      margin: 0 0 4px 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .moderation-content p {
      margin: 0 0 8px 0;
      color: #666;
    }

    .recipes-pending .moderation-icon mat-icon { color: #388e3c; }
    .ratings-pending .moderation-icon mat-icon { color: #ffc107; }
    .users-pending .moderation-icon mat-icon { color: #1976d2; }

    .actions-section button {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .actions-section button mat-icon {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      margin-right: 16px;
    }

    .activity-icon mat-icon {
      color: #1976d2;
    }

    .activity-content p {
      margin: 0 0 4px 0;
      color: #333;
    }

    .activity-content small {
      color: #999;
      font-size: 0.8rem;
    }

    @media (max-width: 768px) {
      .dashboard-content {
        gap: 24px;
      }

      mat-grid-list {
        margin-bottom: 16px;
      }

      .stat-card mat-card-content,
      .moderation-card mat-card-content {
        padding: 12px;
      }

      .stat-content h3 {
        font-size: 1.4rem;
      }

      .moderation-content h3 {
        font-size: 1.2rem;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  statistics?: PlatformStatistics;
  moderationQueue?: ModerationQueue;
  recentActivity: Array<{
    icon: string;
    message: string;
    time: string;
  }> = [];

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
        this.loadMockRecentActivity();
      }
    });
  }

  private loadMockRecentActivity(): void {
    // Mock recent activity data - in a real app, this would come from an API
    this.recentActivity = [
      {
        icon: 'person_add',
        message: 'New user registered: john.doe@example.com',
        time: '2 minutes ago'
      },
      {
        icon: 'restaurant',
        message: 'Recipe "Spaghetti Carbonara" submitted for moderation',
        time: '5 minutes ago'
      },
      {
        icon: 'star',
        message: 'New rating submitted for "Chicken Curry"',
        time: '8 minutes ago'
      },

      {
        icon: 'people',
        message: 'User account activated: jane.smith@example.com',
        time: '1 hour ago'
      }
    ];
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