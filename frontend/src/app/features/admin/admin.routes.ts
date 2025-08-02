import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    data: { requiresAdmin: true },
    loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Admin Dashboard'
      },
      {
        path: 'users',
        loadComponent: () => import('./components/user-management/user-management.component').then(m => m.UserManagementComponent),
        title: 'User Management'
      },
      {
        path: 'recipes',
        loadComponent: () => import('./components/recipe-moderation/recipe-moderation.component').then(m => m.RecipeModerationComponent),
        title: 'Recipe Moderation'
      },

      {
        path: 'content',
        loadComponent: () => import('./components/content-moderation/content-moderation.component').then(m => m.ContentModerationComponent),
        title: 'Content Moderation'
      },
      {
        path: 'analytics',
        loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent),
        title: 'Analytics & Reporting'
      }
    ]
  }
]; 