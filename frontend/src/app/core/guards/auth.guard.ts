import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiresAdmin = route.data['requiresAdmin'] === true;
    return this.checkAuth(state.url, requiresAdmin);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(route, state);
  }

  private checkAuth(url: string, requiresAdmin: boolean = false): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      map(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/auth/login'], { queryParams: { returnUrl: url } });
          return false;
        }
        
        if (requiresAdmin) {
          const currentUser = this.authService.getCurrentUser();
          if (!currentUser || (!currentUser.is_staff && !currentUser.is_superuser)) {
            this.router.navigate(['/recipes']);
            return false;
          }
        }
        
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/auth/login']);
        return of(false);
      })
    );
  }
} 