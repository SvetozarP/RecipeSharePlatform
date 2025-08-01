import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, EMPTY } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('HTTP Error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      let shouldShowSnackBar = true;

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Network Error: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 400:
            // Don't show snackbar for validation errors - let components handle them
            if (req.url.includes('/auth/')) {
              shouldShowSnackBar = false;
            }
            errorMessage = 'Invalid request data';
            break;
            
          case 401:
            // Handle 401 errors more intelligently
            
            // Don't logout for auth endpoints (login/register failures)
            if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
              shouldShowSnackBar = false;
              break;
            }
            
            // Don't logout if user is not currently authenticated
            if (!authService.isAuthenticated()) {
              shouldShowSnackBar = false;
              break;
            }
            
            // Try token refresh first for API calls, but only if refresh token exists and isn't a refresh attempt
            const refreshToken = authService.getRefreshToken();
            if (refreshToken && !req.url.includes('/auth/token/refresh/') && !req.url.includes('/auth/logout/')) {
              console.log('Attempting token refresh due to 401 error');
              
              return authService.refreshToken().pipe(
                switchMap(() => {
                  // Retry the original request with new token
                  const newToken = authService.getToken();
                  const retryRequest = req.clone({
                    headers: req.headers.set('Authorization', `Bearer ${newToken}`)
                  });
                  return next(retryRequest);
                }),
                catchError((refreshError) => {
                  console.log('Token refresh failed, logging out');
                  // Show user-friendly message for expired session
                  snackBar.open('Your session has expired after being inactive. Please log in again.', 'Close', {
                    duration: 7000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['warning-snackbar']
                  });
                  // Skip server call since refresh token is likely expired
                  authService.logout(true);
                  router.navigate(['/auth/login']);
                  return EMPTY;
                })
              );
            }
            
            // If no refresh token or refresh endpoint failed, logout
            errorMessage = 'Session expired. Please log in again.';
            shouldShowSnackBar = false; // We'll show this via the refresh error handler above
            // Skip server call since tokens are likely expired
            authService.logout(true);
            router.navigate(['/auth/login']);
            break;
            
          case 403:
            errorMessage = 'Access forbidden - insufficient permissions';
            break;
            
          case 404:
            errorMessage = 'Requested resource not found';
            break;
            
          case 422:
            // Validation errors - let components handle them
            shouldShowSnackBar = false;
            break;
            
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
            
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
            
          case 502:
          case 503:
          case 504:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
            
          default:
            errorMessage = `Error ${error.status}: ${error.message}`;
        }
      }

      // Show snackbar notification for general errors (not auth-specific)
      if (shouldShowSnackBar) {
        snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }

      return throwError(() => error);
    })
  );
}; 