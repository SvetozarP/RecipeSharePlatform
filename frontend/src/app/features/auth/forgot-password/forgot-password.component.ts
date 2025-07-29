import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MaterialModule } from '../../../shared/material.module';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, LoadingComponent, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div *ngIf="!emailSent">
          <!-- Forgot Password Form -->
          <mat-card class="mt-8">
            <mat-card-content class="space-y-6">
              <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="space-y-6">
                
                <!-- Email Field -->
                <mat-form-field appearance="fill" class="w-full">
                  <mat-label>Email address</mat-label>
                  <input 
                    matInput 
                    type="email" 
                    formControlName="email"
                    autocomplete="email"
                    placeholder="Enter your email address"
                    [class.mat-form-field-invalid]="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched"
                  >
                  <mat-error *ngIf="forgotPasswordForm.get('email')?.hasError('required')">
                    Email is required
                  </mat-error>
                  <mat-error *ngIf="forgotPasswordForm.get('email')?.hasError('email')">
                    Please enter a valid email address
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
                  [disabled]="forgotPasswordForm.invalid || isLoading"
                >
                  <span *ngIf="!isLoading">Send Reset Link</span>
                  <app-loading *ngIf="isLoading" [size]="20"></app-loading>
                </button>
              </form>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Success Message -->
        <div *ngIf="emailSent">
          <mat-card class="mt-8">
            <mat-card-content class="text-center space-y-6 py-8">
              <mat-icon class="text-green-500 text-6xl">check_circle</mat-icon>
              <h3 class="text-xl font-semibold text-gray-900">Check your email</h3>
              <p class="text-gray-600">
                We've sent a password reset link to <strong>{{ submittedEmail }}</strong>
              </p>
              <p class="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or 
                <button 
                  type="button" 
                  class="text-indigo-600 hover:text-indigo-500 underline"
                  (click)="resendEmail()"
                  [disabled]="isLoading"
                >
                  try again
                </button>
              </p>
              
              <div class="pt-4">
                <button 
                  mat-stroked-button 
                  routerLink="/auth/login"
                  class="w-full"
                >
                  Back to Login
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Back to Login Link -->
        <div class="text-center" *ngIf="!emailSent">
          <p class="text-sm text-gray-600">
            Remember your password? 
            <a routerLink="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </a>
          </p>
        </div>

        <!-- Help Information -->
        <div class="text-center mt-6" *ngIf="emailSent">
          <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div class="flex">
              <mat-icon class="text-blue-400 mr-2">info</mat-icon>
              <div class="text-left">
                <h4 class="text-sm font-medium text-blue-800">Having trouble?</h4>
                <p class="text-xs text-blue-700 mt-1">
                  The reset link will expire in 24 hours. If you continue to have issues, 
                  please contact our support team.
                </p>
              </div>
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
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  emailSent = false;
  submittedEmail = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.forgotPasswordForm = this.createForgotPasswordForm();
  }

  ngOnInit(): void {
    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForgotPasswordForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      this.submittedEmail = this.forgotPasswordForm.value.email;

      // TODO: Implement actual password reset API call
      // For now, simulate API call
      this.simulatePasswordResetRequest();
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  resendEmail(): void {
    if (!this.isLoading) {
      this.onSubmit();
    }
  }

  private simulatePasswordResetRequest(): void {
    // TODO: Replace with actual HTTP service call to backend
    // Example implementation:
    /*
    this.authService.requestPasswordReset(this.submittedEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.emailSent = true;
        },
        error: (error) => {
          this.isLoading = false;
          this.handlePasswordResetError(error);
        }
      });
    */

    // Simulate network delay
    setTimeout(() => {
      this.isLoading = false;
      this.emailSent = true;
    }, 2000);
  }

  private handlePasswordResetError(error: any): void {
    if (error.status === 404) {
      this.errorMessage = 'No account found with this email address.';
    } else if (error.status === 429) {
      this.errorMessage = 'Too many reset requests. Please wait before trying again.';
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }
} 