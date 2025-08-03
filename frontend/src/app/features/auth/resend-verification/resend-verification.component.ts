import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MaterialModule } from '../../../shared/material.module';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-resend-verification',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, LoadingComponent, RouterLink],
  templateUrl: './resend-verification.component.html',
  styleUrls: ['./resend-verification.component.scss']
})
export class ResendVerificationComponent implements OnInit, OnDestroy {
  resendForm: FormGroup;
  isLoading = false;
  isSuccess = false;
  errorMessage = '';
  successMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.resendForm = this.createResendForm();
  }

  ngOnInit(): void {
    // Clear any existing messages
    this.errorMessage = '';
    this.successMessage = '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createResendForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.resendForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const email = this.resendForm.value.email;

      this.authService.resendVerificationEmail(email)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.isSuccess = true;
            this.successMessage = response.detail || 'Verification email sent successfully!';
          },
          error: (error) => {
            this.isLoading = false;
            this.handleError(error);
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private handleError(error: any): void {
    if (error.error?.detail) {
      this.errorMessage = error.error.detail;
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resendForm.controls).forEach(key => {
      const control = this.resendForm.get(key);
      control?.markAsTouched();
    });
  }

  onLoginClick(): void {
    this.router.navigate(['/auth/login']);
  }
} 