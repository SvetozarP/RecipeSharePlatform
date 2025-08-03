import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { delay } from 'rxjs/operators';
import { RegisterComponent } from './register.component';
import { MaterialModule } from '../../../shared/material.module';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService, RegisterRequest } from '../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockRegisterResponse = {
    tokens: {
      access: 'mock-access-token',
      refresh: 'mock-refresh-token'
    },
    user: {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User'
    },
    message: 'Registration successful'
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['register']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    const routeSpy = {
      params: of({}),
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        ReactiveFormsModule,
        MaterialModule,
        LoadingComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: ActivatedRoute, useValue: routeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.isLoading).toBe(false);
    expect(component.showPassword).toBe(false);
    expect(component.showConfirmPassword).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  describe('Form Initialization', () => {
    it('should create form with all required fields', () => {
      expect(component.registerForm).toBeDefined();
      expect(component.registerForm.get('firstName')).toBeDefined();
      expect(component.registerForm.get('lastName')).toBeDefined();
      expect(component.registerForm.get('email')).toBeDefined();
      expect(component.registerForm.get('username')).toBeDefined();
      expect(component.registerForm.get('password')).toBeDefined();
      expect(component.registerForm.get('confirmPassword')).toBeDefined();
      expect(component.registerForm.get('acceptTerms')).toBeDefined();
    });

    it('should have correct validators', () => {
      const firstNameControl = component.registerForm.get('firstName');
      const emailControl = component.registerForm.get('email');
      const usernameControl = component.registerForm.get('username');
      const passwordControl = component.registerForm.get('password');
      const acceptTermsControl = component.registerForm.get('acceptTerms');

      expect(firstNameControl?.hasValidator).toBeTruthy();
      expect(emailControl?.hasValidator).toBeTruthy();
      expect(usernameControl?.hasValidator).toBeTruthy();
      expect(passwordControl?.hasValidator).toBeTruthy();
      expect(acceptTermsControl?.hasValidator).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const form = component.registerForm;
      
      expect(form.valid).toBe(false);
      expect(form.get('firstName')?.errors?.['required']).toBeTruthy();
      expect(form.get('lastName')?.errors?.['required']).toBeTruthy();
      expect(form.get('email')?.errors?.['required']).toBeTruthy();
      expect(form.get('username')?.errors?.['required']).toBeTruthy();
      expect(form.get('password')?.errors?.['required']).toBeTruthy();
      expect(form.get('confirmPassword')?.errors?.['required']).toBeTruthy();
      expect(form.get('acceptTerms')?.errors?.['required']).toBeTruthy();
    });

    it('should validate email format', () => {
      const emailControl = component.registerForm.get('email');
      
      emailControl?.setValue('invalid-email');
      expect(emailControl?.errors?.['email']).toBeTruthy();
      
      emailControl?.setValue('valid@email.com');
      expect(emailControl?.errors?.['email']).toBeFalsy();
    });

    it('should validate username pattern', () => {
      const usernameControl = component.registerForm.get('username');
      
      usernameControl?.setValue('invalid username');
      expect(usernameControl?.errors?.['pattern']).toBeTruthy();
      
      usernameControl?.setValue('valid_username123');
      expect(usernameControl?.errors?.['pattern']).toBeFalsy();
    });

    it('should validate password requirements', () => {
      const passwordControl = component.registerForm.get('password');
      
      passwordControl?.setValue('short');
      expect(passwordControl?.errors?.['minlength']).toBeTruthy();
      
      passwordControl?.setValue('onlyletters');
      expect(passwordControl?.errors?.['pattern']).toBeTruthy();
      
      passwordControl?.setValue('ValidPass123');
      expect(passwordControl?.errors).toBeFalsy();
    });

    it('should validate password match', () => {
      const form = component.registerForm;
      
      form.patchValue({
        password: 'ValidPass123',
        confirmPassword: 'DifferentPass123'
      });
      
      expect(form.errors?.['passwordMismatch']).toBeTruthy();
      
      form.patchValue({
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123'
      });
      
      expect(form.errors?.['passwordMismatch']).toBeFalsy();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', () => {
      expect(component.showPassword).toBe(false);
      
      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(true);
      
      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(false);
    });

    it('should toggle confirm password visibility', () => {
      expect(component.showConfirmPassword).toBe(false);
      
      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword).toBe(true);
      
      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword).toBe(false);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Set up valid form data
      component.registerForm.patchValue({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
        acceptTerms: true
      });
    });

    it('should submit form when valid', () => {
      authServiceSpy.register.and.returnValue(of(mockRegisterResponse));
      
      component.onSubmit();
      
      expect(authServiceSpy.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        password: 'ValidPass123',
        password_confirm: 'ValidPass123',
        first_name: 'Test',
        last_name: 'User'
      });
    });

    it('should not submit when form is invalid', () => {
      component.registerForm.patchValue({ firstName: '' });
      
      component.onSubmit();
      
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('should not submit when already loading', () => {
      component.isLoading = true;
      
      component.onSubmit();
      
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('should handle successful registration', () => {
      authServiceSpy.register.and.returnValue(of(mockRegisterResponse));
      
      component.onSubmit();
      
      expect(component.isLoading).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should handle registration error', () => {
      const error = { status: 400, error: { email: ['This email is already registered'] } };
      authServiceSpy.register.and.returnValue(throwError(() => error));
      
      component.onSubmit();
      
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('This email is already registered');
    });
  });

  describe('Error Handling', () => {
    it('should handle email already exists error', () => {
      const error = { status: 400, error: { email: ['This email is already registered'] } };
      (component as any).handleRegistrationError(error);
      
      expect(component.errorMessage).toBe('This email is already registered');
    });

    it('should handle username already taken error', () => {
      const error = { status: 400, error: { username: ['This username is already taken'] } };
      (component as any).handleRegistrationError(error);
      
      expect(component.errorMessage).toBe('This username is already taken');
    });

    it('should handle password validation error', () => {
      const error = { status: 400, error: { password: ['Password is too weak'] } };
      (component as any).handleRegistrationError(error);
      
      expect(component.errorMessage).toBe('Password is too weak');
    });

    it('should handle conflict error', () => {
      const error = { status: 409 };
      (component as any).handleRegistrationError(error);
      
      expect(component.errorMessage).toBe('An account with this email or username already exists.');
    });

    it('should handle rate limit error', () => {
      const error = { status: 429 };
      (component as any).handleRegistrationError(error);
      
      expect(component.errorMessage).toBe('Too many registration attempts. Please try again later.');
    });

    it('should handle network error', () => {
      const error = { status: 0 };
      (component as any).handleRegistrationError(error);
      
      expect(component.errorMessage).toBe('Unable to connect to server. Please check your internet connection.');
    });

    it('should handle generic error', () => {
      const error = { status: 500 };
      (component as any).handleRegistrationError(error);
      
      expect(component.errorMessage).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle array error messages', () => {
      const error = { status: 400, error: { email: ['Error 1', 'Error 2'] } };
      (component as any).handleRegistrationError(error);
      
      expect(component.errorMessage).toBe('Error 1');
    });

    it('should handle non-field errors', () => {
      const error = { status: 400, error: { non_field_errors: ['General error'] } };
      (component as any).handleRegistrationError(error);
      
      expect(component.errorMessage).toBe('General error');
    });
  });

  describe('Form Utilities', () => {
    it('should mark all form controls as touched', () => {
      const firstNameControl = component.registerForm.get('firstName');
      const emailControl = component.registerForm.get('email');
      spyOn(firstNameControl!, 'markAsTouched');
      spyOn(emailControl!, 'markAsTouched');
      
      (component as any).markFormGroupTouched();
      
      expect(firstNameControl?.markAsTouched).toHaveBeenCalled();
      expect(emailControl?.markAsTouched).toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    it('should clear error message on init', () => {
      component.errorMessage = 'Previous error';
      
      component.ngOnInit();
      
      expect(component.errorMessage).toBe('');
    });

    it('should clean up subscriptions on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should clear loading state on error', () => {
      const error = { status: 400, error: {} };
      authServiceSpy.register.and.returnValue(throwError(() => error));
      
      // Set up the form to be valid
      component.registerForm.patchValue({
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      });
      
      component.onSubmit();
      
      expect(component.isLoading).toBe(false);
    });

    it('should not submit when form is invalid', () => {
      // Don't set up the form - leave it invalid
      component.onSubmit();
      
      expect(component.isLoading).toBe(false);
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });
  });
}); 