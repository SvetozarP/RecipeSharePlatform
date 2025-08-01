import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MaterialModule } from '../../../shared/material.module';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService, LoginRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, LoadingComponent, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Or 
            <a routerLink="/auth/register" class="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </a>
          </p>
        </div>

        <!-- Login Form -->
        <mat-card class="mt-8">
          <mat-card-content class="space-y-6">
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
              
              <!-- Email Field -->
              <mat-form-field appearance="fill" class="w-full">
                <mat-label>Email address</mat-label>
                <input 
                  matInput 
                  type="email" 
                  formControlName="email"
                  autocomplete="email"
                  [class.mat-form-field-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                >
                <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                  Please enter a valid email address
                </mat-error>
              </mat-form-field>

              <!-- Password Field -->
              <mat-form-field appearance="fill" class="w-full">
                <mat-label>Password</mat-label>
                <input 
                  matInput 
                  [type]="showPassword ? 'text' : 'password'" 
                  formControlName="password"
                  autocomplete="current-password"
                  [class.mat-form-field-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                >
                <button 
                  type="button" 
                  matSuffix 
                  mat-icon-button 
                  (click)="togglePasswordVisibility()"
                  [attr.aria-label]="'Hide password'"
                  [attr.aria-pressed]="showPassword"
                >
                  <mat-icon>{{showPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                  Password is required
                </mat-error>
                <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
                  Password must be at least 6 characters long
                </mat-error>
              </mat-form-field>

              <!-- Remember Me & Forgot Password -->
              <div class="flex items-center justify-between">
                <mat-checkbox formControlName="rememberMe" color="primary">
                  Remember me
                </mat-checkbox>
                <a routerLink="/auth/forgot-password" class="text-sm text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </a>
              </div>

              <!-- Error Message Display -->
              <mat-error *ngIf="errorMessage" class="text-center">
                <mat-icon>error</mat-icon>
                {{ errorMessage }}
              </mat-error>

              <!-- Submit Button -->
              <button 
                type="submit" 
                mat-raised-button 
                color="primary" 
                class="w-full"
                [disabled]="loginForm.invalid || isLoading"
              >
                <span *ngIf="!isLoading">Sign in</span>
                <app-loading *ngIf="isLoading" [size]="20" [inline]="true" message=""></app-loading>
              </button>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Social Login (Future Enhancement) -->
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-50 text-gray-500">
                Social login coming soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .min-h-screen {
      min-height: 100vh;
    }
    
    /* Auth form specific enhancements */
    .mat-mdc-form-field {
      width: 100%;
      margin-bottom: 8px;
    }
    
    .mat-card {
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/dashboard';
  showPassword = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit(): void {
    // Get return URL from query params or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Clear error messages
    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const loginData: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        remember_me: this.loginForm.value.rememberMe
      };

      this.authService.login(loginData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            
            // TODO Handle "Remember me" functionality with extended token expiry
            if (this.loginForm.value.rememberMe) {
              // This could extend token expiry or use different storage
              console.log('Remember me selected - implementing extended session');
            }

            // Navigate to the return URL
            this.router.navigate([this.returnUrl]);
          },
          error: (error) => {
            this.isLoading = false;
            this.handleLoginError(error);
          }
        });
    } else {
      // Mark all fields as touched to show validations
      this.markFormGroupTouched();
    }
  }

  private handleLoginError(error: any): void {
    if (error.status === 401) {
      this.errorMessage = 'Invalid email or password. Please try again.';
    } else if (error.status === 429) {
      this.errorMessage = 'Too many login attempts. Please try again later.';
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
} 