import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/dashboard-overview/dashboard-overview.component').then(m => m.DashboardOverviewComponent),
        data: { title: 'Dashboard Overview' }
      },
      {
        path: 'recipes',
        loadComponent: () => import('./components/recipe-management-dashboard/recipe-management-dashboard.component').then(m => m.RecipeManagementDashboardComponent),
        data: { title: 'My Recipes' }
      },
      {
        path: 'favorites',
        loadComponent: () => import('./components/favorites-management/favorites-management.component').then(m => m.FavoritesManagementComponent),
        data: { title: 'My Favorites' }
      },
      {
        path: 'statistics',
        loadComponent: () => import('./components/basic-statistics/basic-statistics.component').then(m => m.BasicStatisticsComponent),
        data: { title: 'Statistics' }
      },
      {
        path: 'activity',
        loadComponent: () => import('./components/activity-feed/activity-feed.component').then(m => m.ActivityFeedComponent),
        data: { title: 'Activity Feed' }
      }
    ]
  }
]; 