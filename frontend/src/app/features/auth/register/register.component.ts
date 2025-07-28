import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MaterialModule } from '../../../shared/material.module';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService, RegisterRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, LoadingComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Or 
            <a routerLink="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500">
              sign in to your existing account
            </a>
          </p>
        </div>

        <!-- Registration Form -->
        <mat-card class="mt-8">
          <mat-card-content class="space-y-6">
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
              
              <!-- Name Fields Row -->
              <div class="flex gap-4">
                <!-- First Name -->
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>First Name</mat-label>
                  <input 
                    matInput 
                    type="text" 
                    formControlName="firstName"
                    autocomplete="given-name"
                    [class.mat-form-field-invalid]="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched"
                  >
                  <mat-error *ngIf="registerForm.get('firstName')?.hasError('required')">
                    First name is required
                  </mat-error>
                  <mat-error *ngIf="registerForm.get('firstName')?.hasError('minlength')">
                    First name must be at least 2 characters
                  </mat-error>
                </mat-form-field>

                <!-- Last Name -->
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Last Name</mat-label>
                  <input 
                    matInput 
                    type="text" 
                    formControlName="lastName"
                    autocomplete="family-name"
                    [class.mat-form-field-invalid]="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched"
                  >
                  <mat-error *ngIf="registerForm.get('lastName')?.hasError('required')">
                    Last name is required
                  </mat-error>
                  <mat-error *ngIf="registerForm.get('lastName')?.hasError('minlength')">
                    Last name must be at least 2 characters
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Email Field -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Email address</mat-label>
                <input 
                  matInput 
                  type="email" 
                  formControlName="email"
                  autocomplete="email"
                  [class.mat-form-field-invalid]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
                >
                <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                  Please enter a valid email address
                </mat-error>
              </mat-form-field>

              <!-- Username Field -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Username</mat-label>
                <input 
                  matInput 
                  type="text" 
                  formControlName="username"
                  autocomplete="username"
                  [class.mat-form-field-invalid]="registerForm.get('username')?.invalid && registerForm.get('username')?.touched"
                >
                <mat-hint>Username must be 3-30 characters, letters, numbers, and underscores only</mat-hint>
                <mat-error *ngIf="registerForm.get('username')?.hasError('required')">
                  Username is required
                </mat-error>
                <mat-error *ngIf="registerForm.get('username')?.hasError('minlength')">
                  Username must be at least 3 characters
                </mat-error>
                <mat-error *ngIf="registerForm.get('username')?.hasError('maxlength')">
                  Username cannot exceed 30 characters
                </mat-error>
                <mat-error *ngIf="registerForm.get('username')?.hasError('pattern')">
                  Username can only contain letters, numbers, and underscores
                </mat-error>
              </mat-form-field>

              <!-- Password Field -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Password</mat-label>
                <input 
                  matInput 
                  [type]="showPassword ? 'text' : 'password'" 
                  formControlName="password"
                  autocomplete="new-password"
                  [class.mat-form-field-invalid]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
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
                <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                  Password is required
                </mat-error>
                <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                  Password must be at least 8 characters long
                </mat-error>
                <mat-error *ngIf="registerForm.get('password')?.hasError('pattern')">
                  Password must contain at least one letter and one number
                </mat-error>
              </mat-form-field>

              <!-- Confirm Password Field -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Confirm Password</mat-label>
                <input 
                  matInput 
                  [type]="showConfirmPassword ? 'text' : 'password'" 
                  formControlName="confirmPassword"
                  autocomplete="new-password"
                  [class.mat-form-field-invalid]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched"
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
                <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">
                  Please confirm your password
                </mat-error>
                <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('passwordMismatch')">
                  Passwords do not match
                </mat-error>
              </mat-form-field>

              <!-- Terms and Conditions -->
              <div class="flex items-start">
                <mat-checkbox formControlName="acceptTerms" color="primary" class="mt-1">
                </mat-checkbox>
                <label class="ml-2 text-sm text-gray-600">
                  I agree to the 
                  <a href="/terms" target="_blank" class="text-indigo-600 hover:text-indigo-500">Terms of Service</a>
                  and 
                  <a href="/privacy" target="_blank" class="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
                </label>
              </div>
              <mat-error *ngIf="registerForm.get('acceptTerms')?.hasError('required') && registerForm.get('acceptTerms')?.touched">
                You must accept the terms and conditions
              </mat-error>

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
                [disabled]="registerForm.invalid || isLoading"
              >
                <span *ngIf="!isLoading">Create Account</span>
                <app-loading *ngIf="isLoading" [size]="20"></app-loading>
              </button>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Additional Info -->
        <div class="text-center">
          <p class="text-xs text-gray-500">
            By creating an account, you agree to our community guidelines and terms of service.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .min-h-screen {
      min-height: 100vh;
    }
    
    .flex-1 {
      flex: 1;
    }
  `]
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.createRegisterForm();
  }

  ngOnInit(): void {
    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createRegisterForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
      ]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
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
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const registerData: RegisterRequest = {
        email: this.registerForm.value.email,
        username: this.registerForm.value.username,
        password: this.registerForm.value.password,
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName
      };

      this.authService.register(registerData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            
            // Registration successful - navigate to dashboard
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.isLoading = false;
            this.handleRegistrationError(error);
          }
        });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  private handleRegistrationError(error: any): void {
    if (error.status === 400) {
      // Handle specific validation errors from backend
      if (error.error?.email) {
        this.errorMessage = 'This email is already registered. Please use a different email.';
      } else if (error.error?.username) {
        this.errorMessage = 'This username is already taken. Please choose a different username.';
      } else {
        this.errorMessage = 'Please check your information and try again.';
      }
    } else if (error.status === 409) {
      this.errorMessage = 'An account with this email or username already exists.';
    } else if (error.status === 429) {
      this.errorMessage = 'Too many registration attempts. Please try again later.';
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }
} 