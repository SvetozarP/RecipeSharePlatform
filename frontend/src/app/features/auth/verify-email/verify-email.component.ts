import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { MaterialModule } from '../../../shared/material.module';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, MaterialModule, LoadingComponent],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  isLoading = true;
  isSuccess = false;
  isError = false;
  message = '';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.verifyEmail();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private verifyEmail(): void {
    const uidb64 = this.route.snapshot.paramMap.get('uidb64');
    const token = this.route.snapshot.paramMap.get('token');

    if (!uidb64 || !token) {
      this.handleError('Invalid verification link.');
      return;
    }

    this.http.post(`${environment.apiUrl}/auth/verify-email/${uidb64}/${token}/`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.isSuccess = true;
          this.message = response.detail || 'Email verified successfully!';
        },
        error: (error) => {
          this.isLoading = false;
          this.isError = true;
          this.message = error.error?.detail || 'Email verification failed. Please try again.';
        }
      });
  }

  private handleError(message: string): void {
    this.isLoading = false;
    this.isError = true;
    this.message = message;
  }

  onLoginClick(): void {
    this.router.navigate(['/auth/login']);
  }

  onResendClick(): void {
    this.router.navigate(['/auth/resend-verification']);
  }
} 