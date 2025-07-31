import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService, LoginRequest, LoginResponse } from '../../../core/services/auth.service';
import { MaterialModule } from '../../../shared/material.module';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    firstName: 'Test',
    lastName: 'User',
    isAdmin: false
  };

  const mockAuthResponse: LoginResponse = {
    access: 'mock-access-token',
    refresh: 'mock-refresh-token',
    user: mockUser
  };

  beforeEach(async () => {
    // Create spy objects for dependencies
    mockAuthService = jasmine.createSpyObj('AuthService', ['login']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    // Add events observable for RouterLink
    (mockRouter as any).events = of({});
    mockActivatedRoute = {
      snapshot: {
        queryParams: {}
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        MaterialModule,
        BrowserAnimationsModule,
        LoadingComponent
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.showPassword).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.returnUrl).toBe('/dashboard');
    });

    it('should create login form with proper validators', () => {
      const form = component.loginForm;
      expect(form).toBeDefined();
      
      // Check form controls exist
      expect(form.get('email')).toBeDefined();
      expect(form.get('password')).toBeDefined();
      expect(form.get('rememberMe')).toBeDefined();
      
      // Check initial values
      expect(form.get('email')?.value).toBe('');
      expect(form.get('password')?.value).toBe('');
      expect(form.get('rememberMe')?.value).toBeFalse();
    });

    it('should set return URL from query params', () => {
      mockActivatedRoute.snapshot.queryParams = { returnUrl: '/profile' };
      
      const newFixture = TestBed.createComponent(LoginComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      
      expect(newComponent.returnUrl).toBe('/profile');
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.valid).toBeFalse();
    });

    it('should require email', () => {
      const emailControl = component.loginForm.get('email');
      expect(emailControl?.hasError('required')).toBeTrue();
      
      emailControl?.setValue('test@example.com');
      expect(emailControl?.hasError('required')).toBeFalse();
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');
      
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBeTrue();
      
      emailControl?.setValue('valid@example.com');
      expect(emailControl?.hasError('email')).toBeFalse();
    });

    it('should require password', () => {
      const passwordControl = component.loginForm.get('password');
      expect(passwordControl?.hasError('required')).toBeTrue();
      
      passwordControl?.setValue('password123');
      expect(passwordControl?.hasError('required')).toBeFalse();
    });

    it('should validate password minimum length', () => {
      const passwordControl = component.loginForm.get('password');
      
      passwordControl?.setValue('123');
      expect(passwordControl?.hasError('minlength')).toBeTrue();
      
      passwordControl?.setValue('123456');
      expect(passwordControl?.hasError('minlength')).toBeFalse();
    });

    it('should be valid with proper email and password', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(component.loginForm.valid).toBeTrue();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', () => {
      expect(component.showPassword).toBeFalse();
      
      component.togglePasswordVisibility();
      expect(component.showPassword).toBeTrue();
      
      component.togglePasswordVisibility();
      expect(component.showPassword).toBeFalse();
    });

    it('should update password input type when toggled', () => {
      const passwordInput = fixture.debugElement.nativeElement.querySelector('input[formControlName="password"]');
      
      expect(passwordInput.type).toBe('password');
      
      component.togglePasswordVisibility();
      fixture.detectChanges();
      
      expect(passwordInput.type).toBe('text');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      });
    });

    it('should not submit if form is invalid', () => {
      component.loginForm.patchValue({ email: 'invalid-email' });
      
      component.onSubmit();
      
      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });

    it('should not submit if already loading', () => {
      component.isLoading = true;
      
      component.onSubmit();
      
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should call auth service with correct data on valid submission', () => {
      mockAuthService.login.and.returnValue(of(mockAuthResponse));
      
      component.onSubmit();
      
      const expectedLoginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
        remember_me: false
      };
      
      expect(mockAuthService.login).toHaveBeenCalledWith(expectedLoginData);
    });

    it('should set loading state during submission', () => {
      const loginSubject = new Subject<LoginResponse>();
      mockAuthService.login.and.returnValue(loginSubject.asObservable());
      
      // Set up valid form data
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(component.isLoading).toBeFalse();
      
      component.onSubmit();
      
      expect(component.isLoading).toBeTrue();
      
      // Complete the observable to clean up
      loginSubject.next(mockAuthResponse);
      loginSubject.complete();
    });

    it('should navigate to return URL on successful login', () => {
      component.returnUrl = '/profile';
      mockAuthService.login.and.returnValue(of(mockAuthResponse));
      
      component.onSubmit();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
      expect(component.isLoading).toBeFalse();
    });

    it('should clear error message on successful login', () => {
      component.errorMessage = 'Previous error';
      mockAuthService.login.and.returnValue(of(mockAuthResponse));
      
      component.onSubmit();
      
      expect(component.errorMessage).toBe('');
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.loginForm.patchValue({ email: '' }); // Make form invalid
      
      spyOn(component.loginForm.get('email') as any, 'markAsTouched');
      spyOn(component.loginForm.get('password') as any, 'markAsTouched');
      spyOn(component.loginForm.get('rememberMe') as any, 'markAsTouched');
      
      component.onSubmit();
      
      expect(component.loginForm.get('email')?.markAsTouched).toHaveBeenCalled();
      expect(component.loginForm.get('password')?.markAsTouched).toHaveBeenCalled();
      expect(component.loginForm.get('rememberMe')?.markAsTouched).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should handle 400 Bad Request error', () => {
      const error = { status: 400 };
      mockAuthService.login.and.returnValue(throwError(() => error));
      
      component.onSubmit();
      
      expect(component.errorMessage).toBe('An unexpected error occurred. Please try again.');
      expect(component.isLoading).toBeFalse();
    });

    it('should handle 401 Unauthorized error', () => {
      const error = { status: 401 };
      mockAuthService.login.and.returnValue(throwError(() => error));
      
      component.onSubmit();
      
      expect(component.errorMessage).toBe('Invalid email or password. Please try again.');
      expect(component.isLoading).toBeFalse();
    });

    it('should handle 429 Too Many Requests error', () => {
      const error = { status: 429 };
      mockAuthService.login.and.returnValue(throwError(() => error));
      
      component.onSubmit();
      
      expect(component.errorMessage).toBe('Too many login attempts. Please try again later.');
      expect(component.isLoading).toBeFalse();
    });

    it('should handle network connection error', () => {
      const error = { status: 0 };
      mockAuthService.login.and.returnValue(throwError(() => error));
      
      component.onSubmit();
      
      expect(component.errorMessage).toBe('Unable to connect to server. Please check your internet connection.');
      expect(component.isLoading).toBeFalse();
    });

    it('should handle unexpected errors', () => {
      const error = { status: 500 };
      mockAuthService.login.and.returnValue(throwError(() => error));
      
      component.onSubmit();
      
      expect(component.errorMessage).toBe('An unexpected error occurred. Please try again.');
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('UI Elements', () => {
    it('should display email and password fields', () => {
      const emailField = fixture.debugElement.nativeElement.querySelector('input[formControlName="email"]');
      const passwordField = fixture.debugElement.nativeElement.querySelector('input[formControlName="password"]');
      
      expect(emailField).toBeTruthy();
      expect(passwordField).toBeTruthy();
    });

    it('should display remember me checkbox', () => {
      const rememberMeCheckbox = fixture.debugElement.nativeElement.querySelector('mat-checkbox[formControlName="rememberMe"]');
      expect(rememberMeCheckbox).toBeTruthy();
    });

    it('should display submit button', () => {
      const submitButton = fixture.debugElement.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton).toBeTruthy();
      expect(submitButton.textContent.trim()).toContain('Sign in');
    });

    it('should disable submit button when form is invalid', () => {
      const submitButton = fixture.debugElement.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBeTrue();
    });

    it('should enable submit button when form is valid', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      fixture.detectChanges();
      
      const submitButton = fixture.debugElement.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBeFalse();
    });

    it('should disable submit button when loading', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      component.isLoading = true;
      fixture.detectChanges();
      
      const submitButton = fixture.debugElement.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBeTrue();
    });

    it('should display error message when present', () => {
      component.errorMessage = 'Test error message';
      fixture.detectChanges();
      
      const errorElement = fixture.debugElement.nativeElement.querySelector('mat-error');
      expect(errorElement.textContent).toContain('Test error message');
    });

    it('should display loading component when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const loadingComponent = fixture.debugElement.nativeElement.querySelector('app-loading');
      expect(loadingComponent).toBeTruthy();
    });
  });

  describe('Component Lifecycle', () => {
    it('should clear error message on init', () => {
      component.errorMessage = 'Previous error';
      component.ngOnInit();
      expect(component.errorMessage).toBe('');
    });

    it('should complete destroy subject on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Remember Me Functionality', () => {
    it('should log remember me selection', () => {
      spyOn(console, 'log');
      mockAuthService.login.and.returnValue(of(mockAuthResponse));
      
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      });
      
      component.onSubmit();
      
      expect(console.log).toHaveBeenCalledWith('Remember me selected - implementing extended session');
    });
  });
}); 