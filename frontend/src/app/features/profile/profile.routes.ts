import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard],
    data: { title: 'User Profile' }
  }
]; 