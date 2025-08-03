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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/dashboard';
  showPassword = false;
  isEmailVerificationError = false;

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
      this.isEmailVerificationError = false;

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
    this.isEmailVerificationError = false;
    
    if (error.status === 401) {
      // Check if it's an email verification error
      if (error.error?.email) {
        this.errorMessage = error.error.email;
        this.isEmailVerificationError = true;
      } else {
        this.errorMessage = 'Invalid email or password. Please try again.';
      }
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