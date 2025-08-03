import { Routes } from '@angular/router';
import { GuestGuard } from '../../core/guards/guest.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    canActivate: [GuestGuard],
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [GuestGuard],
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [GuestGuard],
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password/:uidb64/:token',
    canActivate: [GuestGuard],
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'verify-email/:uidb64/:token',
    canActivate: [GuestGuard],
    loadComponent: () => import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'resend-verification',
    canActivate: [GuestGuard],
    loadComponent: () => import('./resend-verification/resend-verification.component').then(m => m.ResendVerificationComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
]; 