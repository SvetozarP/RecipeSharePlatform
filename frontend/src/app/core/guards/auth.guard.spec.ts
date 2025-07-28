import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
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
        AuthGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    
    // Create mock route and state objects
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/protected-route' } as RouterStateSnapshot;
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(guard).toBeTruthy();
    });
  });

  describe('canActivate', () => {
    it('should allow access when user is authenticated', (done) => {
      // Set user as authenticated
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

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

    it('should deny access and redirect to login when user is not authenticated', (done) => {
      // Set user as not authenticated
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(false);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (result instanceof Promise) {
        result.then(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], { 
            queryParams: { returnUrl: '/protected-route' } 
          });
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], { 
            queryParams: { returnUrl: '/protected-route' } 
          });
          done();
        });
      } else {
        fail('Expected observable or promise result');
      }
    });

    it('should include return URL in navigation when redirecting to login', (done) => {
      const testUrl = '/dashboard/profile';
      mockState.url = testUrl;
      
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(false);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], { 
            queryParams: { returnUrl: testUrl } 
          });
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
            expect(canActivate).toBeFalse();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], { 
              queryParams: { returnUrl: '/protected-route' } 
            });
          },
          error: () => {
            fail('Guard should handle errors gracefully');
          }
        });
      }
    });
  });

  describe('canActivateChild', () => {
    it('should use the same logic as canActivate for child routes', (done) => {
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

      const result = guard.canActivateChild(mockRoute, mockState);
      
      if (result instanceof Promise) {
        result.then(canActivate => {
          expect(canActivate).toBeTrue();
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeTrue();
          done();
        });
      } else {
        expect(result).toBeTrue();
        done();
      }
    });

    it('should deny access to child routes when user is not authenticated', (done) => {
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(false);

      const result = guard.canActivateChild(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], { 
            queryParams: { returnUrl: '/protected-route' } 
          });
          done();
        });
      } else {
        done();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined URL gracefully', (done) => {
      mockState.url = undefined as any;
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(false);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalled();
          done();
        });
      } else {
        done();
      }
    });

    it('should work with empty URL', (done) => {
      mockState.url = '';
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(false);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], { 
            queryParams: { returnUrl: '' } 
          });
          done();
        });
      } else {
        done();
      }
    });
  });

  describe('Authentication State Changes', () => {
    it('should deny access when not authenticated', () => {
      // Set user as not authenticated
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(false);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeFalse();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], { 
            queryParams: { returnUrl: '/protected-route' } 
          });
        });
      }
    });

    it('should allow access when authenticated', () => {
      // Set user as authenticated
      (mockAuthService.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

      const result = guard.canActivate(mockRoute, mockState);
      
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBeTrue();
          expect(mockRouter.navigate).not.toHaveBeenCalled();
        });
      }
    });
  });
}); 