import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, interval, Subscription } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

import { MaterialModule } from '../../../shared/material.module';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService } from '../../../core/services/auth.service';

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

                <!-- Cooldown Message -->
                <div *ngIf="isOnCooldown" class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div class="flex items-center">
                    <mat-icon class="text-yellow-400 mr-2">schedule</mat-icon>
                    <div>
                      <p class="text-sm text-yellow-800">
                        Please wait <strong>{{ cooldownTimeLeft }}</strong> seconds before requesting another reset link.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Submit Button -->
                <button 
                  type="submit" 
                  mat-raised-button 
                  color="primary" 
                  class="w-full"
                  [disabled]="forgotPasswordForm.invalid || isLoading || isOnCooldown"
                >
                  <span *ngIf="!isLoading && !isOnCooldown">Send Reset Link</span>
                  <span *ngIf="isOnCooldown">Wait {{ cooldownTimeLeft }}s</span>
                  <app-loading *ngIf="isLoading" [size]="20" [inline]="true" message=""></app-loading>
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
              
              <!-- Cooldown Message for Resend -->
              <div *ngIf="isOnCooldown" class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div class="flex items-center justify-center">
                  <mat-icon class="text-yellow-400 mr-2">schedule</mat-icon>
                  <p class="text-sm text-yellow-800">
                    You can request another reset link in <strong>{{ cooldownTimeLeft }}</strong> seconds
                  </p>
                </div>
              </div>

              <p class="text-sm text-gray-500" *ngIf="!isOnCooldown">
                Didn't receive the email? Check your spam folder or 
                <button 
                  type="button" 
                  class="text-indigo-600 hover:text-indigo-500 underline"
                  (click)="resendEmail()"
                  [disabled]="isLoading || isOnCooldown"
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

    /* Cooldown styling */
    .bg-yellow-50 {
      background-color: #fefce8;
    }
    .border-yellow-200 {
      border-color: #fde047;
    }
    .text-yellow-400 {
      color: #facc15;
    }
    .text-yellow-800 {
      color: #854d0e;
    }
  `]
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  emailSent = false;
  submittedEmail = '';
  
  // Cooldown functionality
  isOnCooldown = false;
  cooldownTimeLeft = 0;
  private cooldownDuration = 60; // 60 seconds
  private cooldownSubscription?: Subscription;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.forgotPasswordForm = this.createForgotPasswordForm();
  }

  ngOnInit(): void {
    this.errorMessage = '';
    // Check if there's an active cooldown from previous session
    this.checkExistingCooldown();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.cooldownSubscription) {
      this.cooldownSubscription.unsubscribe();
    }
  }

  private createForgotPasswordForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid && !this.isLoading && !this.isOnCooldown) {
      this.isLoading = true;
      this.errorMessage = '';
      this.submittedEmail = this.forgotPasswordForm.value.email;

      this.authService.requestPasswordReset(this.submittedEmail)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.emailSent = true;
            this.startCooldown();
          },
          error: (error) => {
            this.isLoading = false;
            this.handlePasswordResetError(error);
            // Start cooldown even on error to prevent spam
            if (error.status !== 404) {
              this.startCooldown();
            }
          }
        });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  resendEmail(): void {
    if (!this.isLoading && !this.isOnCooldown) {
      this.onSubmit();
    }
  }

  private startCooldown(): void {
    this.isOnCooldown = true;
    this.cooldownTimeLeft = this.cooldownDuration;
    
    // Save cooldown end time to localStorage for persistence
    const cooldownEndTime = Date.now() + (this.cooldownDuration * 1000);
    localStorage.setItem('password_reset_cooldown', cooldownEndTime.toString());

    // Start countdown timer
    this.cooldownSubscription = interval(1000).pipe(
      take(this.cooldownDuration),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.cooldownTimeLeft--;
        if (this.cooldownTimeLeft <= 0) {
          this.endCooldown();
        }
      },
      complete: () => {
        this.endCooldown();
      }
    });
  }

  private endCooldown(): void {
    this.isOnCooldown = false;
    this.cooldownTimeLeft = 0;
    localStorage.removeItem('password_reset_cooldown');
    if (this.cooldownSubscription) {
      this.cooldownSubscription.unsubscribe();
    }
  }

  private checkExistingCooldown(): void {
    const cooldownEndTime = localStorage.getItem('password_reset_cooldown');
    if (cooldownEndTime) {
      const endTime = parseInt(cooldownEndTime, 10);
      const currentTime = Date.now();
      
      if (currentTime < endTime) {
        // Cooldown still active
        const remainingTime = Math.ceil((endTime - currentTime) / 1000);
        this.cooldownTimeLeft = remainingTime;
        this.isOnCooldown = true;
        
        // Start countdown from remaining time
        this.cooldownSubscription = interval(1000).pipe(
          take(remainingTime),
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.cooldownTimeLeft--;
            if (this.cooldownTimeLeft <= 0) {
              this.endCooldown();
            }
          },
          complete: () => {
            this.endCooldown();
          }
        });
      } else {
        // Cooldown expired, clean up
        localStorage.removeItem('password_reset_cooldown');
      }
    }
  }

  private handlePasswordResetError(error: any): void {
    if (error.status === 404) {
      this.errorMessage = 'No account found with this email address.';
    } else if (error.status === 400) {
      this.errorMessage = 'Invalid email address format.';
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