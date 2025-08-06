import { Routes } from '@angular/router';
import { GuestGuard } from '../../core/guards/guest.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    canActivate: [GuestGuard],
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    data: { title: 'Login' }
  },
  {
    path: 'register',
    canActivate: [GuestGuard],
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
    data: { title: 'Register' }
  },
  {
    path: 'forgot-password',
    canActivate: [GuestGuard],
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    data: { title: 'Forgot Password' }
  },
  {
    path: 'reset-password/:uidb64/:token',
    canActivate: [GuestGuard],
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    data: { title: 'Reset Password' }
  },
  {
    path: 'verify-email/:uidb64/:token',
    canActivate: [GuestGuard],
    loadComponent: () => import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
    data: { title: 'Verify Email' }
  },
  {
    path: 'resend-verification',
    canActivate: [GuestGuard],
    loadComponent: () => import('./resend-verification/resend-verification.component').then(m => m.ResendVerificationComponent),
    data: { title: 'Resend Verification' }
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
]; 