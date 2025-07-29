import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
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

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="app-footer">
        <div class="footer-content">
          <p>&copy; 2025 Recipe Sharing Platform. Built with Angular 20 & Django REST Framework.</p>
        </div>
      </footer>
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
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Recipe Sharing Platform';
  isMobile = false;
  
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
    // TODO: Implement mobile sidenav in future iterations
    console.log('Mobile sidenav toggle - to be implemented');
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth < 768;
  }
} 