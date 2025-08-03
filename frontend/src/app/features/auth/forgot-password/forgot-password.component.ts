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
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']})
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