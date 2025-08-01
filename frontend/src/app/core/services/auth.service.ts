import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  firstName?: string;  // For backward compatibility
  lastName?: string;   // For backward compatibility
  is_email_verified?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;   // For staff access control
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

// Updated to match backend response structure
export interface AuthResponse {
  tokens: {
    access: string;
    refresh: string;
  };
  user: User;
  message?: string;
}

// Login response uses different structure
export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login/`, credentials)
      .pipe(
        tap(response => this.handleLoginSuccess(response)),
        catchError(error => {
          console.error('Login error:', error);
          throw error;
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register/`, userData)
      .pipe(
        tap(response => this.handleRegisterSuccess(response)),
        catchError(error => {
          console.error('Registration error:', error);
          throw error;
        })
      );
  }

  logout(skipServerCall = false): void {
    const refreshToken = this.getRefreshToken();
    
    // Try to blacklist the token on the server only if tokens aren't expired
    if (refreshToken && !skipServerCall) {
      this.http.post(`${environment.apiUrl}/auth/logout/`, { refresh: refreshToken })
        .subscribe({
          next: () => console.log('Token blacklisted successfully'),
          error: (error) => {
            console.warn('Failed to blacklist token:', error);
            // If blacklisting fails, it's likely the token is already expired
            // Don't treat this as a critical error
          }
        });
    }

    // Clear local storage regardless of server response
    this.clearTokens();
  }

  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Navigate away from current route and then to recipes to ensure component reload
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/recipes']);
    });
  }

  // Check if we should attempt token refresh or just logout
  private shouldAttemptRefresh(): boolean {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }
    
    // If we can decode the token, check if it's not expired
    try {
      const payload = JSON.parse(atob(refreshToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      // If we can't decode the token, assume it might still be valid
      return true;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.hasToken() && this.getCurrentUser() !== null;
  }

  refreshToken(): Observable<{ access: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearTokens();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ access: string }>(`${environment.apiUrl}/auth/token/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.access);
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        // For expired refresh tokens, skip server call during logout
        this.logout(true);
        throw error;
      })
    );
  }

  requestPasswordReset(email: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${environment.apiUrl}/auth/password/reset/`, {
      email: email
    }).pipe(
      catchError(error => {
        console.error('Password reset request error:', error);
        throw error;
      })
    );
  }

  confirmPasswordReset(uidb64: string, token: string, newPassword: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${environment.apiUrl}/auth/password/reset/confirm/`, {
      uidb64: uidb64,
      token: token,
      password: newPassword
    }).pipe(
      catchError(error => {
        console.error('Password reset confirm error:', error);
        throw error;
      })
    );
  }

  // Handle login response (flat structure)
  private handleLoginSuccess(response: LoginResponse): void {
    const user = this.normalizeUser(response.user);
    
    localStorage.setItem(this.TOKEN_KEY, response.access);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    
    console.log('Login successful:', user);
  }

  // Handle registration response (nested tokens structure)
  private handleRegisterSuccess(response: AuthResponse): void {
    const user = this.normalizeUser(response.user);
    
    localStorage.setItem(this.TOKEN_KEY, response.tokens.access);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.tokens.refresh);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    
    console.log('Registration successful:', user);
    if (response.message) {
      console.log('Message:', response.message);
    }
  }

  // Normalize user object to handle different field naming conventions
  private normalizeUser(user: any): User {
    return {
      ...user,
      firstName: user.first_name || user.firstName,
      lastName: user.last_name || user.lastName,
      first_name: user.first_name || user.firstName,
      last_name: user.last_name || user.lastName
    };
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private getCurrentUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return this.normalizeUser(user);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        localStorage.removeItem(this.USER_KEY);
      }
    }
    return null;
  }
} 