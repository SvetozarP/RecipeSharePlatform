import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { MaterialModule } from './shared/material.module';
import { AuthService, User } from './core/services/auth.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    firstName: 'Test',
    lastName: 'User'
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: of(mockUser),
      isAuthenticated$: of(true)
    });
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    routerSpyObj.createUrlTree.and.returnValue({} as any);
    routerSpyObj.serializeUrl.and.returnValue('');
    (routerSpyObj as any).events = of({});
    const routeSpy = {
      params: of({}),
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, MaterialModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: ActivatedRoute, useValue: routeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct title', () => {
    expect(component.title).toBe('Recipe Sharing Platform');
  });

  it('should have default values', () => {
    expect(component.isMobile).toBe(false);
  });

  describe('Authentication State', () => {
    it('should expose current user observable', () => {
      component.currentUser$.subscribe(user => {
        expect(user).toEqual(mockUser);
      });
    });

    it('should expose authentication state observable', () => {
      component.isAuthenticated$.subscribe(isAuth => {
        expect(isAuth).toBe(true);
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to recipes page', () => {
      component.navigateHome();
      
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/recipes']);
    });
  });

  describe('Authentication Actions', () => {
    it('should call auth service logout', () => {
      component.logout();
      
      expect(authServiceSpy.logout).toHaveBeenCalled();
    });

    it('should logout and close sidenav', () => {
      spyOn(component, 'closeSidenav');
      
      component.logoutAndClose();
      
      expect(authServiceSpy.logout).toHaveBeenCalled();
      expect(component.closeSidenav).toHaveBeenCalled();
    });
  });

  describe('Sidenav Management', () => {
    it('should toggle sidenav when available', () => {
      const mockSidenav = jasmine.createSpyObj('MatSidenav', ['toggle']);
      component.sidenav = mockSidenav;
      
      component.toggleSidenav();
      
      expect(mockSidenav.toggle).toHaveBeenCalled();
    });

    it('should not toggle sidenav when not available', () => {
      component.sidenav = null as any;
      
      expect(() => component.toggleSidenav()).not.toThrow();
    });

    it('should close sidenav when available', () => {
      const mockSidenav = jasmine.createSpyObj('MatSidenav', ['close']);
      component.sidenav = mockSidenav;
      
      component.closeSidenav();
      
      expect(mockSidenav.close).toHaveBeenCalled();
    });

    it('should not close sidenav when not available', () => {
      component.sidenav = null as any;
      
      expect(() => component.closeSidenav()).not.toThrow();
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      spyOn(window, 'addEventListener');
    });

    it('should initialize on ngOnInit', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1024);
      
      component.ngOnInit();
      
      expect(window.addEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function));
    });

    it('should set mobile to true for small screens', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(600);
      
      component.ngOnInit();
      
      expect(component.isMobile).toBe(true);
    });

    it('should set mobile to false for large screens', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1024);
      
      component.ngOnInit();
      
      expect(component.isMobile).toBe(false);
    });

    it('should handle resize events', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(600);
      
      component.ngOnInit();
      
      // Simulate resize event
      const resizeHandler = (window.addEventListener as jasmine.Spy).calls.mostRecent().args[1];
      resizeHandler();
      
      expect(component.isMobile).toBe(true);
    });
  });

  describe('ViewChild Integration', () => {
    it('should have sidenav ViewChild', () => {
      fixture.detectChanges();
      
      expect(component.sidenav).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle null sidenav gracefully', () => {
      component.sidenav = null as any;
      
      expect(() => component.toggleSidenav()).not.toThrow();
      expect(() => component.closeSidenav()).not.toThrow();
    });
  });
}); 