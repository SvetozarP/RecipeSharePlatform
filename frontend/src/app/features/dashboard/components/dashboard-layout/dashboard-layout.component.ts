import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/material.module';
import { AuthService } from '../../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, MaterialModule],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  isMenuOpen = false;
  activeRoute = '';
  
  private destroy$ = new Subject<void>();

  navigationItems = [
    {
      label: 'Overview',
      route: '/dashboard',
      icon: 'dashboard',
      description: 'Dashboard overview'
    },
    {
      label: 'My Recipes',
      route: '/dashboard/recipes',
      icon: 'restaurant',
      description: 'Manage your recipes'
    },
    {
      label: 'Favorites',
      route: '/dashboard/favorites',
      icon: 'favorite',
      description: 'Your favorite recipes'
    },
    {
      label: 'Collections',
      route: '/dashboard/collections',
      icon: 'folder',
      description: 'Recipe collections'
    },
    {
      label: 'Statistics',
      route: '/dashboard/statistics',
      icon: 'analytics',
      description: 'Cooking statistics'
    },
    {
      label: 'Activity',
      route: '/dashboard/activity',
      icon: 'history',
      description: 'Recent activity'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.updateActiveRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  private updateActiveRoute(): void {
    this.activeRoute = this.router.url;
  }

  onNavigate(route: string): void {
    this.router.navigate([route]);
    this.activeRoute = route;
    this.isMenuOpen = false; // Close mobile menu after navigation
  }

  onToggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onCreateRecipe(): void {
    this.router.navigate(['/recipes/create']);
  }

  onBrowseRecipes(): void {
    this.router.navigate(['/recipes']);
  }

  onProfile(): void {
    this.router.navigate(['/profile']);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  isActiveRoute(route: string): boolean {
    if (route === '/dashboard') {
      return this.activeRoute === '/dashboard';
    }
    return this.activeRoute.startsWith(route);
  }

  getWelcomeMessage(): string {
    const name = this.currentUser?.first_name || this.currentUser?.username || 'Chef';
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return `Good morning, ${name}!`;
    } else if (hour < 17) {
      return `Good afternoon, ${name}!`;
    } else {
      return `Good evening, ${name}!`;
    }
  }
}