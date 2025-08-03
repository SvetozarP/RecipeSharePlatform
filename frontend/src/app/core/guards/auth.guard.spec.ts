import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    is_staff: false,
    is_superuser: false
  };

  const mockAdminUser = {
    ...mockUser,
    is_staff: true,
    is_superuser: false
  };

  const mockSuperUser = {
    ...mockUser,
    is_staff: false,
    is_superuser: true
  };

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authSpy.isAuthenticated$ = of(true);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    let mockRoute: ActivatedRouteSnapshot;
    let mockState: RouterStateSnapshot;

    beforeEach(() => {
      mockRoute = {
        data: {}
      } as ActivatedRouteSnapshot;
      mockState = {
        url: '/protected-route'
      } as RouterStateSnapshot;
    });

    it('should allow access for authenticated users', () => {
      authServiceSpy.isAuthenticated$ = of(true);
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);

      const result = guard.canActivate(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(true);
          expect(routerSpy.navigate).not.toHaveBeenCalled();
        });
      }
    });

    it('should redirect to login for unauthenticated users', () => {
      authServiceSpy.isAuthenticated$ = of(false);

      const result = guard.canActivate(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(false);
          expect(routerSpy.navigate).toHaveBeenCalledWith(
            ['/auth/login'],
            { queryParams: { returnUrl: '/protected-route' } }
          );
        });
      }
    });

    it('should allow access for admin users when admin required', () => {
      authServiceSpy.isAuthenticated$ = of(true);
      authServiceSpy.getCurrentUser.and.returnValue(mockAdminUser);
      mockRoute.data = { requiresAdmin: true };

      const result = guard.canActivate(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(true);
          expect(routerSpy.navigate).not.toHaveBeenCalled();
        });
      }
    });

    it('should allow access for superusers when admin required', () => {
      authServiceSpy.isAuthenticated$ = of(true);
      authServiceSpy.getCurrentUser.and.returnValue(mockSuperUser);
      mockRoute.data = { requiresAdmin: true };

      const result = guard.canActivate(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(true);
          expect(routerSpy.navigate).not.toHaveBeenCalled();
        });
      }
    });

    it('should redirect to recipes for non-admin users when admin required', () => {
      authServiceSpy.isAuthenticated$ = of(true);
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      mockRoute.data = { requiresAdmin: true };

      const result = guard.canActivate(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(false);
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/recipes']);
        });
      }
    });

    it('should redirect to recipes when admin required but no current user', () => {
      authServiceSpy.isAuthenticated$ = of(true);
      authServiceSpy.getCurrentUser.and.returnValue(null);
      mockRoute.data = { requiresAdmin: true };

      const result = guard.canActivate(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(false);
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/recipes']);
        });
      }
    });

    it('should handle authentication errors gracefully', () => {
      authServiceSpy.isAuthenticated$ = throwError(() => new Error('Auth error'));

      const result = guard.canActivate(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(false);
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
        });
      }
    });

    it('should not require admin by default', () => {
      authServiceSpy.isAuthenticated$ = of(true);
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      mockRoute.data = {};

      const result = guard.canActivate(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(true);
          expect(routerSpy.navigate).not.toHaveBeenCalled();
        });
      }
    });
  });

  describe('canActivateChild', () => {
    let mockRoute: ActivatedRouteSnapshot;
    let mockState: RouterStateSnapshot;

    beforeEach(() => {
      mockRoute = {
        data: {}
      } as ActivatedRouteSnapshot;
      mockState = {
        url: '/protected-child-route'
      } as RouterStateSnapshot;
    });

    it('should delegate to canActivate', () => {
      authServiceSpy.isAuthenticated$ = of(true);
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      spyOn(guard, 'canActivate').and.returnValue(of(true));

      const result = guard.canActivateChild(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(true);
          expect(guard.canActivate).toHaveBeenCalledWith(mockRoute, mockState);
        });
      }
    });

    it('should handle admin requirements in child routes', () => {
      authServiceSpy.isAuthenticated$ = of(true);
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      mockRoute.data = { requiresAdmin: true };

      const result = guard.canActivateChild(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(false);
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/recipes']);
        });
      }
    });
  });

  describe('Edge Cases', () => {
    let mockRoute: ActivatedRouteSnapshot;
    let mockState: RouterStateSnapshot;

    beforeEach(() => {
      mockRoute = {
        data: {}
      } as ActivatedRouteSnapshot;
      mockState = {
        url: '/test-route'
      } as RouterStateSnapshot;
    });

    it('should handle empty route data', () => {
      authServiceSpy.isAuthenticated$ = of(true);
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      mockRoute.data = {};

      const result = guard.canActivate(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(true);
        });
      }
    });

    it('should handle false requiresAdmin value', () => {
      authServiceSpy.isAuthenticated$ = of(true);
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      mockRoute.data = { requiresAdmin: false };

      const result = guard.canActivate(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(true);
        });
      }
    });
  });

  describe('Navigation Behavior', () => {
    let mockRoute: ActivatedRouteSnapshot;
    let mockState: RouterStateSnapshot;

    beforeEach(() => {
      mockRoute = {
        data: {}
      } as ActivatedRouteSnapshot;
      mockState = {
        url: '/admin/dashboard'
      } as RouterStateSnapshot;
    });

    it('should preserve return URL when redirecting to login', () => {
      authServiceSpy.isAuthenticated$ = of(false);

      const result = guard.canActivate(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(false);
          expect(routerSpy.navigate).toHaveBeenCalledWith(
            ['/auth/login'],
            { queryParams: { returnUrl: '/admin/dashboard' } }
          );
        });
      }
    });

    it('should not include return URL when handling errors', () => {
      authServiceSpy.isAuthenticated$ = throwError(() => new Error('Auth error'));

      const result = guard.canActivate(mockRoute, mockState);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(false);
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
        });
      }
    });
  });
}); 