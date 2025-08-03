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
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  isResetComplete = false;
  showPassword = false;
  showConfirmPassword = false;
  
  private uidb64 = '';
  private token = '';
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