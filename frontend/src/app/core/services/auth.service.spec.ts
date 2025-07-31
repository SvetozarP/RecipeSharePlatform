import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, LoginResponse } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    spy.navigateByUrl.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: spy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login user and store tokens', () => {
    const loginRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockResponse: LoginResponse = {
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        firstName: 'Test',
        lastName: 'User'
      }
    };

    service.login(loginRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(localStorage.getItem('access_token')).toBe('mock-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginRequest);
    req.flush(mockResponse);
  });

  it('should logout and clear tokens', () => {
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('refresh_token', 'test-refresh');
    localStorage.setItem('current_user', JSON.stringify({ id: 1, email: 'test@example.com' }));

    service.logout();

    // Handle the HTTP request for logout
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout/`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('current_user')).toBeNull();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/', { skipLocationChange: true });
  });

  it('should return token when getToken is called', () => {
    localStorage.setItem('access_token', 'test-token');
    expect(service.getToken()).toBe('test-token');
  });

  it('should return false if user is not authenticated', () => {
    localStorage.clear();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should handle registration correctly', () => {
    const registerRequest = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      password_confirm: 'password123',
      first_name: 'Test',
      last_name: 'User'
    };

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

    service.register(registerRequest).subscribe(response => {
      expect(response).toEqual(mockRegisterResponse);
      expect(localStorage.getItem('access_token')).toBe('mock-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(registerRequest);
    req.flush(mockRegisterResponse);
  });

  it('should handle token refresh', () => {
    localStorage.setItem('refresh_token', 'test-refresh-token');
    
    const mockRefreshResponse = {
      access: 'new-access-token'
    };

    service.refreshToken().subscribe(response => {
      expect(response).toEqual(mockRefreshResponse);
      expect(localStorage.getItem('access_token')).toBe('new-access-token');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/token/refresh/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refresh: 'test-refresh-token' });
    req.flush(mockRefreshResponse);
  });
}); 