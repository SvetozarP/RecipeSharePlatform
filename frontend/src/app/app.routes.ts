import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/recipes',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [GuestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'recipes',
    loadChildren: () => import('./features/recipes/recipe.routes').then(m => m.recipeRoutes)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes)
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.profileRoutes)
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    data: { requiresAdmin: true },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    redirectTo: '/recipes'
  }
]; 