import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MaterialModule } from '../../../shared/material.module';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService, RegisterRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, LoadingComponent, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']})
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
        password_confirm: this.registerForm.value.confirmPassword,
        first_name: this.registerForm.value.firstName,
        last_name: this.registerForm.value.lastName
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
    console.error('Registration error details:', error);
    
    if (error.status === 400) {
      // Handle specific validation errors from backend
      const errorDetails = error.error;
      
      if (errorDetails?.email) {
        this.errorMessage = Array.isArray(errorDetails.email) 
          ? errorDetails.email[0] 
          : 'This email is already registered. Please use a different email.';
      } else if (errorDetails?.username) {
        this.errorMessage = Array.isArray(errorDetails.username)
          ? errorDetails.username[0]
          : 'This username is already taken. Please choose a different username.';
      } else if (errorDetails?.password) {
        this.errorMessage = Array.isArray(errorDetails.password)
          ? errorDetails.password[0]
          : 'Password validation failed. Please check the requirements.';
      } else if (errorDetails?.password_confirm) {
        this.errorMessage = Array.isArray(errorDetails.password_confirm)
          ? errorDetails.password_confirm[0]
          : 'Password confirmation failed.';
      } else if (errorDetails?.non_field_errors) {
        this.errorMessage = Array.isArray(errorDetails.non_field_errors)
          ? errorDetails.non_field_errors[0]
          : 'Please check your information and try again.';
      } else {
        // Show the first available error message
        const firstError = Object.values(errorDetails)[0];
        this.errorMessage = Array.isArray(firstError) ? firstError[0] : 'Please check your information and try again.';
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