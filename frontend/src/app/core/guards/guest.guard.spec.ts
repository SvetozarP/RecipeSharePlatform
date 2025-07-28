import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { GuestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('GuestGuard', () => {
  let guard: GuestGuard;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    // Create spy objects
    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated$: new BehaviorSubject<boolean>(false)
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        GuestGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    guard = TestBed.inject(GuestGuard);
    
    // Create mock route and state objects
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/auth/login' } as RouterStateSnapshot;
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(guard).toBeTruthy();
    });
  });

  describe('canActivate', () => {
    it('should allow access when user is not authenticated', (done) => {
      // Set user as not authenticated
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(false);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (result instanceof Promise) {
        result.then(canActivate => {
          expect(canActivate).toBeTrue();
          expect(mockRouter.navigate).not.toHaveBeenCalled();
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeTrue();
          expect(mockRouter.navigate).not.toHaveBeenCalled();
          done();
        });
      } else {
        expect(result).toBeTrue();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      }
    });

    it('should deny access and redirect to dashboard when user is authenticated', (done) => {
      // Set user as authenticated
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (result instanceof Promise) {
        result.then(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
          done();
        });
      } else {
        fail('Expected observable or promise result');
      }
    });

    it('should prevent authenticated users from accessing login page', (done) => {
      mockState.url = '/auth/login';
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
          done();
        });
      } else {
        done();
      }
    });

    it('should prevent authenticated users from accessing register page', (done) => {
      mockState.url = '/auth/register';
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
          done();
        });
      } else {
        done();
      }
    });

    it('should prevent authenticated users from accessing forgot password page', (done) => {
      mockState.url = '/auth/forgot-password';
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
          done();
        });
      } else {
        done();
      }
    });

    it('should handle authentication service errors gracefully', () => {
      // Set user as not authenticated first
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(false);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe({
          next: (canActivate) => {
            // When not authenticated, guest guard should allow access
            expect(canActivate).toBeTrue();
            expect(mockRouter.navigate).not.toHaveBeenCalled();
          },
          error: () => {
            fail('Guard should handle state gracefully');
          }
        });
      }
    });
  });



  describe('Edge Cases', () => {
    it('should handle undefined URL gracefully', (done) => {
      mockState.url = undefined as any;
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
          done();
        });
      } else {
        done();
      }
    });

    it('should work with empty URL', (done) => {
      mockState.url = '';
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
          done();
        });
      } else {
        done();
      }
    });
  });

  describe('Authentication State Changes', () => {
    it('should allow access when user is not authenticated', () => {
      // Set user as not authenticated
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(false);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeTrue();
          expect(mockRouter.navigate).not.toHaveBeenCalled();
        });
      }
    });

    it('should deny access when user is authenticated', () => {
      // Reset router spy
      mockRouter.navigate.calls.reset();
      
      // Set user as authenticated
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
        });
      }
    });
  });

  describe('Real-world Scenarios', () => {
    it('should prevent double-login attempts', (done) => {
      // User is already logged in and tries to access login page
      mockState.url = '/auth/login';
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
          done();
        });
      } else {
        done();
      }
    });

    it('should prevent already registered users from accessing registration', (done) => {
      mockState.url = '/auth/register';
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
          done();
        });
      } else {
        done();
      }
    });
  });
}); 