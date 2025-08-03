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
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']})
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