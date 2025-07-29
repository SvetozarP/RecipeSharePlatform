import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MaterialModule } from '../../../shared/material.module';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, LoadingComponent, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            Set new password
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <div *ngIf="!isResetComplete">
          <!-- Reset Password Form -->
          <mat-card class="mt-8">
            <mat-card-content class="space-y-6">
              <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="space-y-6">
                
                <!-- New Password Field -->
                <mat-form-field appearance="fill" class="w-full">
                  <mat-label>New Password</mat-label>
                  <input 
                    matInput 
                    [type]="showPassword ? 'text' : 'password'" 
                    formControlName="password"
                    autocomplete="new-password"
                    [class.mat-form-field-invalid]="resetPasswordForm.get('password')?.invalid && resetPasswordForm.get('password')?.touched"
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
                  <mat-hint>Password must be at least 8 characters with numbers and letters</mat-hint>
                  <mat-error *ngIf="resetPasswordForm.get('password')?.hasError('required')">
                    Password is required
                  </mat-error>
                  <mat-error *ngIf="resetPasswordForm.get('password')?.hasError('minlength')">
                    Password must be at least 8 characters long
                  </mat-error>
                  <mat-error *ngIf="resetPasswordForm.get('password')?.hasError('pattern')">
                    Password must contain at least one letter and one number
                  </mat-error>
                </mat-form-field>

                <!-- Confirm Password Field -->
                <mat-form-field appearance="fill" class="w-full">
                  <mat-label>Confirm New Password</mat-label>
                  <input 
                    matInput 
                    [type]="showConfirmPassword ? 'text' : 'password'" 
                    formControlName="confirmPassword"
                    autocomplete="new-password"
                    [class.mat-form-field-invalid]="resetPasswordForm.get('confirmPassword')?.invalid && resetPasswordForm.get('confirmPassword')?.touched"
                  >
                  <button 
                    type="button" 
                    matSuffix 
                    mat-icon-button 
                    (click)="toggleConfirmPasswordVisibility()"
                    [attr.aria-label]="'Hide confirm password'"
                    [attr.aria-pressed]="showConfirmPassword"
                  >
                    <mat-icon>{{showConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                  <mat-error *ngIf="resetPasswordForm.get('confirmPassword')?.hasError('required')">
                    Please confirm your password
                  </mat-error>
                  <mat-error *ngIf="resetPasswordForm.get('confirmPassword')?.hasError('passwordMismatch')">
                    Passwords do not match
                  </mat-error>
                </mat-form-field>

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
                  [disabled]="resetPasswordForm.invalid || isLoading"
                >
                  <span *ngIf="!isLoading">Reset Password</span>
                  <app-loading *ngIf="isLoading" [size]="20"></app-loading>
                </button>
              </form>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Success Message -->
        <div *ngIf="isResetComplete">
          <mat-card class="mt-8">
            <mat-card-content class="text-center space-y-6 py-8">
              <mat-icon class="text-green-500 text-6xl">check_circle</mat-icon>
              <h3 class="text-xl font-semibold text-gray-900">Password Reset Complete</h3>
              <p class="text-gray-600">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              
              <div class="pt-4">
                <button 
                  mat-raised-button 
                  color="primary"
                  routerLink="/auth/login"
                  class="w-full"
                >
                  Sign In
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Back to Login Link -->
        <div class="text-center" *ngIf="!isResetComplete">
          <p class="text-sm text-gray-600">
            Remember your password? 
            <a routerLink="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .min-h-screen {
      min-height: 100vh;
    }
    
    .text-6xl {
      font-size: 4rem;
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
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  isResetComplete = false;
  showPassword = false;
  showConfirmPassword = false;
  
  private uidb64: string = '';
  private token: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.resetPasswordForm = this.createResetPasswordForm();
  }

  ngOnInit(): void {
    // Get uidb64 and token from route parameters
    this.uidb64 = this.route.snapshot.paramMap.get('uidb64') || '';
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    if (!this.uidb64 || !this.token) {
      this.errorMessage = 'Invalid reset link. Please request a new password reset.';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createResetPasswordForm(): FormGroup {
    return this.fb.group({
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Clear the error if passwords match
      if (confirmPassword.hasError('passwordMismatch')) {
        confirmPassword.setErrors(null);
      }
      return null;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && !this.isLoading && this.uidb64 && this.token) {
      this.isLoading = true;
      this.errorMessage = '';

      const newPassword = this.resetPasswordForm.value.password;

      this.authService.confirmPasswordReset(this.uidb64, this.token, newPassword)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.isResetComplete = true;
          },
          error: (error) => {
            this.isLoading = false;
            this.handleResetError(error);
          }
        });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  private handleResetError(error: any): void {
    if (error.status === 400) {
      if (error.error?.token) {
        this.errorMessage = 'Invalid or expired reset link. Please request a new password reset.';
      } else if (error.error?.password) {
        this.errorMessage = 'Password validation failed. Please check the requirements.';
      } else {
        this.errorMessage = 'Invalid request. Please check your information and try again.';
      }
    } else if (error.status === 404) {
      this.errorMessage = 'Reset link not found. Please request a new password reset.';
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resetPasswordForm.controls).forEach(key => {
      const control = this.resetPasswordForm.get(key);
      control?.markAsTouched();
    });
  }
} 