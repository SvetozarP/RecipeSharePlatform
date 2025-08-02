import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
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
    MatMenuModule,
    RouterLink
  ],
  template: `
    <mat-sidenav-container class="admin-container">
      <mat-sidenav #sidenav 
                   [mode]="isMobile ? 'over' : 'side'" 
                   [opened]="!isMobile"
                   class="admin-sidenav">
        <div class="sidenav-header">
          <h2>Admin Panel</h2>
        </div>
        
        <mat-nav-list class="sidenav-nav">
          <a mat-list-item 
             routerLink="dashboard" 
             routerLinkActive="active-link">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          
          <a mat-list-item 
             routerLink="users" 
             routerLinkActive="active-link">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>User Management</span>
          </a>
          
          <a mat-list-item 
             routerLink="recipes" 
             routerLinkActive="active-link">
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
             routerLinkActive="active-link">
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
             routerLinkActive="active-link">
            <mat-icon matListItemIcon>analytics</mat-icon>
            <span matListItemTitle>Analytics & Reporting</span>
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
          <button mat-icon-button (click)="sidenav.toggle()" class="menu-toggle" *ngIf="isMobile">
            <mat-icon>menu</mat-icon>
          </button>
          
          <span class="toolbar-title">Recipe Sharing Platform - Admin</span>
          
          <span class="toolbar-spacer"></span>
          
          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-menu-button">
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
      background-color: #f5f5f5;
    }
    
    .admin-sidenav {
      width: 280px;
      background-color: white;
      border-right: 1px solid #e0e0e0;
      box-shadow: 2px 0 4px rgba(0,0,0,0.1);
      height: 100vh;
      z-index: 1000;
    }
    
    .sidenav-header {
      padding: 20px 16px;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: white;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .sidenav-header h2 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .sidenav-nav {
      padding: 16px 0;
      height: calc(100vh - 140px);
      overflow-y: auto;
    }
    
    .sidenav-nav mat-list-item {
      margin: 4px 8px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }
    
    .sidenav-nav mat-list-item:hover {
      background-color: #f5f5f5;
      transform: translateX(4px);
    }
    
    .sidenav-nav mat-list-item mat-icon {
      color: #666;
      transition: color 0.2s ease;
    }
    
    .sidenav-nav mat-list-item:hover mat-icon {
      color: #1976d2;
    }
    
    .sidenav-footer {
      padding: 16px;
      position: absolute;
      bottom: 0;
      width: 100%;
      box-sizing: border-box;
      background-color: white;
      border-top: 1px solid #e0e0e0;
    }
    
    .logout-button {
      width: 100%;
      justify-content: flex-start;
      color: #d32f2f;
      border-radius: 8px;
      transition: all 0.2s ease;
    }
    
    .logout-button:hover {
      background-color: #ffebee;
      color: #c62828;
    }
    
    .admin-content {
      display: flex;
      flex-direction: column;
    }
    
    .admin-toolbar {
      position: sticky;
      top: 0;
      z-index: 999;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      min-height: 64px;
      display: flex;
      align-items: center;
      padding: 0 16px;
    }
    
    .menu-toggle {
      display: none;
      margin-right: 16px;
    }
    
    .toolbar-title {
      font-size: 1.2rem;
      font-weight: 500;
      color: white;
    }
    
    .toolbar-spacer {
      flex: 1 1 auto;
    }
    
    .user-menu-button {
      color: white;
    }
    
    .admin-content-area {
      flex: 1;
      padding: 32px;
      background-color: #f5f5f5;
      overflow-y: auto;
      min-height: calc(100vh - 64px);
    }
    
    .active-link {
      background-color: #e3f2fd !important;
      color: #1976d2 !important;
      border-left: 4px solid #1976d2;
      margin-left: 4px;
      border-radius: 8px 0 0 8px;
    }
    
    .active-link mat-icon {
      color: #1976d2 !important;
    }
    
    .active-link span {
      color: #1976d2 !important;
      font-weight: 500;
    }
    
    .notification-badge {
      font-size: 18px;
    }
    
    /* Ensure content area takes full width */
    .mat-drawer-content {
      width: 100% !important;
    }
    
    /* Desktop-first responsive design */
    @media (max-width: 1024px) {
      .admin-sidenav {
        width: 260px;
      }
      
      .admin-content-area {
        padding: 24px;
      }
    }
    
    @media (max-width: 768px) {
      .admin-sidenav {
        width: 100%;
        max-width: 280px;
      }
      
      .menu-toggle {
        display: block;
      }
      
      .admin-content-area {
        padding: 16px;
      }
    }
  `]
})
export class AdminComponent implements OnInit {
  moderationQueue?: ModerationQueue;
  isMobile = false;

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
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
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