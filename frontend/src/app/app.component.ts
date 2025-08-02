import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { MaterialModule } from './shared/material.module';
import { AuthService, User } from './core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MaterialModule],
  template: `
    <div class="app-container">
      <!-- Navigation Header -->
      <mat-toolbar color="primary" class="mat-elevation-1">
        <button mat-icon-button (click)="toggleSidenav()" *ngIf="isMobile">
          <mat-icon>menu</mat-icon>
        </button>
        
        <span class="cursor-pointer font-bold text-lg" (click)="navigateHome()">
          Recipe Sharing Platform
        </span>
        
        <span class="flex-1"></span>
        
        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-4">
          <button mat-button routerLink="/recipes">
            <mat-icon>restaurant</mat-icon>
            Recipes
          </button>
          
          <button mat-button routerLink="/dashboard" *ngIf="currentUser$ | async">
            <mat-icon>dashboard</mat-icon>
            Dashboard
          </button>
          
          <button mat-button routerLink="/profile" *ngIf="currentUser$ | async">
            <mat-icon>person</mat-icon>
            Profile
          </button>
          
          <button mat-button routerLink="/auth/login" *ngIf="!(isAuthenticated$ | async)">
            <mat-icon>login</mat-icon>
            Login
          </button>
          
          <button mat-button (click)="logout()" *ngIf="isAuthenticated$ | async">
            <mat-icon>logout</mat-icon>
            Logout
          </button>
        </div>
      </mat-toolbar>

      <!-- Mobile Sidenav -->
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav 
          #sidenav 
          mode="over" 
          opened="false" 
          class="mobile-sidenav"
          [class.hidden]="!isMobile">
          
          <!-- User Info Section -->
          <div class="sidenav-header" *ngIf="currentUser$ | async as user">
            <div class="user-info">
              <mat-icon class="user-avatar">account_circle</mat-icon>
              <div class="user-details">
                <h3 class="user-name">{{ user.first_name || user.username }}</h3>
                <p class="user-email">{{ user.email }}</p>
              </div>
            </div>
          </div>
          
          <!-- Navigation Links -->
          <mat-nav-list class="sidenav-nav">
            <a mat-list-item routerLink="/recipes" (click)="closeSidenav()">
              <mat-icon matListItemIcon>restaurant</mat-icon>
              <span matListItemTitle>Recipes</span>
            </a>
            
            <a mat-list-item routerLink="/dashboard" (click)="closeSidenav()" *ngIf="currentUser$ | async">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Dashboard</span>
            </a>
            
            <a mat-list-item routerLink="/profile" (click)="closeSidenav()" *ngIf="currentUser$ | async">
              <mat-icon matListItemIcon>person</mat-icon>
              <span matListItemTitle>Profile</span>
            </a>
            
            <mat-divider></mat-divider>
            
            <!-- Auth Actions -->
            <a mat-list-item routerLink="/auth/login" (click)="closeSidenav()" *ngIf="!(isAuthenticated$ | async)">
              <mat-icon matListItemIcon>login</mat-icon>
              <span matListItemTitle>Login</span>
            </a>
            
            <button mat-list-item (click)="logoutAndClose()" *ngIf="isAuthenticated$ | async">
              <mat-icon matListItemIcon>logout</mat-icon>
              <span matListItemTitle>Logout</span>
            </button>
          </mat-nav-list>
        </mat-sidenav>

        <!-- Main Content -->
        <mat-sidenav-content class="sidenav-content">
          <main class="main-content">
            <router-outlet></router-outlet>
          </main>

          <!-- Footer -->
          <footer class="app-footer">
            <div class="footer-content">
              <p>&copy; 2025 Recipe Sharing Platform. Built with Angular 20 & Django REST Framework.</p>
            </div>
          </footer>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #fafafa;
    }
    
    .mat-toolbar {
      background: linear-gradient(45deg, #2196F3 30%, #21CBF3 90%);
      color: white;
      z-index: 1000;
      position: relative;
    }
    
    .sidenav-container {
      flex: 1;
      height: calc(100vh - 64px);
    }
    
    .mobile-sidenav {
      width: 280px;
      background: white;
      border-right: 1px solid #e0e0e0;
    }
    
    .mobile-sidenav.hidden {
      display: none;
    }
    
    .sidenav-header {
      padding: 24px 16px;
      background: linear-gradient(45deg, #2196F3 30%, #21CBF3 90%);
      color: white;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .user-avatar {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: white;
    }
    
    .user-details {
      flex: 1;
    }
    
    .user-name {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.2;
    }
    
    .user-email {
      margin: 4px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    
    .sidenav-nav {
      padding-top: 8px;
    }
    
    .sidenav-nav mat-list-item {
      margin: 4px 8px;
      border-radius: 8px;
      transition: background-color 0.2s ease;
    }
    
    .sidenav-nav mat-list-item:hover {
      background-color: #f5f5f5;
    }
    
    .sidenav-nav mat-list-item mat-icon {
      color: #666;
    }
    
    .sidenav-content {
      background-color: #fafafa;
    }
    
    .main-content {
      flex: 1;
      min-height: calc(100vh - 128px);
    }
    
    .app-footer {
      background: white;
      border-top: 1px solid #e0e0e0;
      margin-top: auto;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 16px;
      text-align: center;
      color: #666;
    }
    
    @media (max-width: 768px) {
      .footer-content {
        padding: 16px 8px;
      }
      
      .mobile-sidenav {
        width: 260px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Recipe Sharing Platform';
  isMobile = false;
  
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  currentUser$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  ngOnInit() {
    this.checkMobileView();
    window.addEventListener('resize', () => this.checkMobileView());
  }

  navigateHome() {
    this.router.navigate(['/recipes']);
  }

  logout() {
    this.authService.logout();
  }

  toggleSidenav() {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  closeSidenav() {
    if (this.sidenav) {
      this.sidenav.close();
    }
  }

  logoutAndClose() {
    this.logout();
    this.closeSidenav();
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth < 768;
  }
} 