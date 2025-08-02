import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../services/admin.service';
import { ModerationQueue } from '../models/admin.models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatBadgeModule,
    MatMenuModule
  ],
  template: `
    <mat-sidenav-container class="admin-container">
      <mat-sidenav #sidenav mode="side" opened class="admin-sidenav">
        <div class="sidenav-header">
          <h2>Admin Panel</h2>
        </div>
        
        <mat-nav-list>
          <a mat-list-item 
             routerLink="dashboard" 
             routerLinkActive="active-link"
             (click)="sidenav.close()">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          
          <a mat-list-item 
             routerLink="users" 
             routerLinkActive="active-link"
             (click)="sidenav.close()">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>User Management</span>
          </a>
          
          <a mat-list-item 
             routerLink="recipes" 
             routerLinkActive="active-link"
             (click)="sidenav.close()">
            <mat-icon matListItemIcon>restaurant</mat-icon>
            <span matListItemTitle>Recipe Moderation</span>
            <mat-icon matListItemMeta 
                      *ngIf="hasPendingRecipes"
                      [matBadge]="pendingRecipesCount"
                      matBadgeColor="warn"
                      class="notification-badge">
              notifications
            </mat-icon>
          </a>
          

          
          <a mat-list-item 
             routerLink="content" 
             routerLinkActive="active-link"
             (click)="sidenav.close()">
            <mat-icon matListItemIcon>rate_review</mat-icon>
            <span matListItemTitle>Content Moderation</span>
            <mat-icon matListItemMeta 
                      *ngIf="hasPendingRatings"
                      [matBadge]="pendingRatingsCount"
                      matBadgeColor="warn"
                      class="notification-badge">
              notifications
            </mat-icon>
          </a>
          
          <a mat-list-item 
             routerLink="analytics" 
             routerLinkActive="active-link"
             (click)="sidenav.close()">
            <mat-icon matListItemIcon>analytics</mat-icon>
            <span matListItemTitle>Analytics & Reporting</span>
          </a>
          
          <a mat-list-item 
             routerLink="settings" 
             routerLinkActive="active-link"
             (click)="sidenav.close()">
            <mat-icon matListItemIcon>settings</mat-icon>
            <span matListItemTitle>System Settings</span>
          </a>
        </mat-nav-list>
        
        <mat-divider></mat-divider>
        
        <div class="sidenav-footer">
          <button mat-button (click)="logout()" class="logout-button">
            <mat-icon>logout</mat-icon>
            Logout
          </button>
        </div>
      </mat-sidenav>
      
      <mat-sidenav-content class="admin-content">
        <mat-toolbar color="primary" class="admin-toolbar">
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          
          <span class="toolbar-title">Recipe Sharing Platform - Admin</span>
          
          <span class="toolbar-spacer"></span>
          
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item (click)="goToMainSite()">
              <mat-icon>home</mat-icon>
              <span>Go to Main Site</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </mat-toolbar>
        
        <div class="admin-content-area">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .admin-container {
      height: 100vh;
      display: flex;
    }
    
    .admin-sidenav {
      width: 280px;
      background-color: #fafafa;
      border-right: 1px solid #e0e0e0;
    }
    
    .sidenav-header {
      padding: 16px;
      background-color: #1976d2;
      color: white;
    }
    
    .sidenav-header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 500;
    }
    
    .sidenav-footer {
      padding: 16px;
      position: absolute;
      bottom: 0;
      width: 100%;
      box-sizing: border-box;
      background-color: #fafafa;
      border-top: 1px solid #e0e0e0;
    }
    
    .logout-button {
      width: 100%;
      justify-content: flex-start;
      color: #d32f2f;
    }
    
    .admin-content {
      display: flex;
      flex-direction: column;
    }
    
    .admin-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .toolbar-title {
      margin-left: 16px;
      font-size: 1.1rem;
    }
    
    .toolbar-spacer {
      flex: 1 1 auto;
    }
    
    .admin-content-area {
      flex: 1;
      padding: 24px;
      background-color: #f5f5f5;
      overflow-y: auto;
    }
    
    .active-link {
      background-color: #e3f2fd;
      color: #1976d2;
    }
    
    .active-link mat-icon {
      color: #1976d2;
    }
    
    .notification-badge {
      font-size: 18px;
    }
    
    @media (max-width: 768px) {
      .admin-sidenav {
        width: 100%;
        max-width: 280px;
      }
      
      .admin-content-area {
        padding: 16px;
      }
    }
  `]
})
export class AdminComponent implements OnInit {
  moderationQueue?: ModerationQueue;

  // Getter methods for safe access to moderation queue counts
  get pendingRecipesCount(): number {
    return this.moderationQueue?.recipes?.pending || 0;
  }

  get pendingRatingsCount(): number {
    return this.moderationQueue?.ratings?.pending || 0;
  }

  get hasPendingRecipes(): boolean {
    return this.pendingRecipesCount > 0;
  }

  get hasPendingRatings(): boolean {
    return this.pendingRatingsCount > 0;
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkAdminAccess();
    this.loadModerationQueue();
  }

  private checkAdminAccess(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.isStaff) {
      this.snackBar.open('Access denied. Admin privileges required.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.router.navigate(['/']);
    }
  }

  private loadModerationQueue(): void {
    this.adminService.getModerationQueue().subscribe({
      next: (queue) => {
        this.moderationQueue = queue;
      },
      error: (error) => {
        console.error('Failed to load moderation queue:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  goToMainSite(): void {
    this.router.navigate(['/']);
  }
} 