import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { LoginRequest, LoginResponse, AuthUser, RegisterRequest, RegisterResponse } from '../models/api.models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: AuthUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  };

  const mockLoginResponse: LoginResponse = {
    user: mockUser,
    token: 'fake-jwt-token-12345',
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with no authenticated user', () => {
      expect(service.getCurrentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should load user from localStorage on initialization', () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('authToken', 'saved-token');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
      });

      const newService = TestBed.inject(AuthService);

      expect(newService.getCurrentUser()).toEqual({ ...mockUser, token: 'saved-token' });
      expect(newService.isAuthenticated()).toBe(true);
    });
  });

  describe('Login Functionality', () => {
    it('should login successfully and store user data', () => {
      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      };

      service.login(credentials).subscribe((response) => {
        expect(response).toEqual(mockLoginResponse);

        expect(service.getCurrentUser()).toEqual({ ...mockUser, token: 'fake-jwt-token-12345' });
        expect(service.isAuthenticated()).toBe(true);

        expect(localStorage.getItem('currentUser')).toBe(JSON.stringify(mockUser));
        expect(localStorage.getItem('authToken')).toBe('fake-jwt-token-12345');
      });

      const req = httpMock.expectOne('http://localhost:8000/api/auth/login/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);

      req.flush(mockLoginResponse);
    });

    it('should handle login errors correctly', () => {
      const credentials: LoginRequest = {
        username: 'wronguser',
        password: 'wrongpass',
      };

      const errorResponse = {
        error: { detail: 'Invalid credentials' },
        status: 401,
      };

      service.login(credentials).subscribe({
        next: () => fail('Should have failed with 401 error'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.error.detail).toBe('Invalid credentials');

          expect(service.getCurrentUser()).toBeNull();
          expect(service.isAuthenticated()).toBe(false);
        },
      });

      const req = httpMock.expectOne('http://localhost:8000/api/auth/login/');
      req.flush(errorResponse.error, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle network errors during login', () => {
      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      };

      service.login(credentials).subscribe({
        next: () => fail('Should have failed with network error'),
        error: (error) => {
          expect(error).toBeTruthy();
          // The service should still be in unauthenticated state
          // Note: getCurrentUser() may return previous state, but localStorage should be clean
          expect(service.isAuthenticated()).toBe(false);
        },
      });

      const req = httpMock.expectOne('http://localhost:8000/api/auth/login/');
      // CONCEPT: Simulate network error
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('authToken', 'fake-token');
      service['currentUserSubject'].next({ ...mockUser, token: 'fake-token' });
      service.isAuthenticated.set(true);
    });

    it('should logout successfully and clear user data', () => {
      service.logout().subscribe((_response) => {
        expect(service.getCurrentUser()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('currentUser')).toBeNull();
        expect(localStorage.getItem('authToken')).toBeNull();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/auth/logout/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});

      req.flush({});
    });

    it('should clear local data even if logout API fails', () => {
      service.logout().subscribe((_response) => {
        expect(service.getCurrentUser()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('currentUser')).toBeNull();
        expect(localStorage.getItem('authToken')).toBeNull();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/auth/logout/');
      req.error(new ErrorEvent('Server error'));
    });

    it('should handle logout when no token exists', () => {
      localStorage.removeItem('authToken');
      service['clearUserData']();

      service.logout().subscribe((response) => {
        expect(response).toBeNull();
        expect(service.getCurrentUser()).toBeNull();
      });

      httpMock.expectNone('http://localhost:8000/api/auth/logout/');
    });
  });

  describe('Authentication Status', () => {
    it('should check auth status with valid token', () => {
      localStorage.setItem('authToken', 'valid-token');

      service.checkAuthStatus().subscribe((isAuthenticated) => {
        expect(isAuthenticated).toBe(true);
        expect(service.isAuthenticated()).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/auth/me/');
      expect(req.request.method).toBe('GET');

      req.flush(mockUser);
    });

    it('should handle invalid token by clearing data', () => {
      localStorage.setItem('authToken', 'invalid-token');
      localStorage.setItem('currentUser', JSON.stringify(mockUser));

      service.checkAuthStatus().subscribe((isAuthenticated) => {
        expect(isAuthenticated).toBe(false);
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('authToken')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/auth/me/');
      req.flush({ detail: 'Invalid token' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should return false when no token exists', () => {
      service.checkAuthStatus().subscribe((isAuthenticated) => {
        expect(isAuthenticated).toBe(false);
      });

      httpMock.expectNone('http://localhost:8000/api/auth/me/');
    });
  });

  describe('Utility Methods', () => {
    it('should get auth token from localStorage', () => {
      localStorage.setItem('authToken', 'test-token');
      expect(service.getAuthToken()).toBe('test-token');
    });

    it('should return null when no token exists', () => {
      expect(service.getAuthToken()).toBeNull();
    });

    it('should get current user observable', () => {
      const testUser = { ...mockUser, token: 'test-token' };
      service['currentUserSubject'].next(testUser);

      service.currentUser$.subscribe((user) => {
        expect(user).toEqual(testUser);
      });
    });
  });

  describe('Signal State Management', () => {
    it('should update isAuthenticated signal on login', () => {
      expect(service.isAuthenticated()).toBe(false);

      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne('http://localhost:8000/api/auth/login/');
      req.flush(mockLoginResponse);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should update isAuthenticated signal on logout', () => {
      service.isAuthenticated.set(true);
      localStorage.setItem('authToken', 'test-token');

      service.logout().subscribe();

      const req = httpMock.expectOne('http://localhost:8000/api/auth/logout/');
      req.flush({});

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('currentUser', 'invalid-json-data');
      localStorage.setItem('authToken', 'some-token');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
      });

      expect(() => {
        const newService = TestBed.inject(AuthService);
        expect(newService.getCurrentUser()).toBeNull();
        expect(newService.isAuthenticated()).toBe(false);
      }).not.toThrow();
    });

    it('should handle empty string token', () => {
      localStorage.setItem('authToken', '');

      service.checkAuthStatus().subscribe((isAuthenticated) => {
        expect(isAuthenticated).toBe(false);
      });

      httpMock.expectNone('http://localhost:8000/api/auth/me/');
    });

    it('should use correct API URL for login requests', () => {
      const credentials: LoginRequest = {
        username: 'test',
        password: 'test',
      };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne((request) => request.url.includes('/api/auth/login/'));
      expect(req.request.method).toBe('POST');
      req.flush(mockLoginResponse);
    });
  });

  describe('Registration Functionality', () => {
    const mockRegisterRequest: RegisterRequest = {
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      first_name: 'New',
      last_name: 'User',
    };

    const mockRegisterResponse: RegisterResponse = {
      user: {
        id: 2,
        username: 'newuser',
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
      },
      token: 'new-user-token-123',
    };

    it('should register successfully and store user data', () => {
      service.register(mockRegisterRequest).subscribe((response) => {
        expect(response).toEqual(mockRegisterResponse);

        expect(service.getCurrentUser()).toEqual({ ...mockRegisterResponse.user, token: 'new-user-token-123' });
        expect(service.isAuthenticated()).toBe(true);

        expect(localStorage.getItem('currentUser')).toBe(JSON.stringify(mockRegisterResponse.user));
        expect(localStorage.getItem('authToken')).toBe('new-user-token-123');
      });

      const req = httpMock.expectOne('http://localhost:8000/api/auth/register/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRegisterRequest);

      req.flush(mockRegisterResponse);
    });

    it('should register with minimal data', () => {
      const minimalRequest: RegisterRequest = {
        username: 'minimaluser',
        password: 'password123',
      };

      const minimalResponse: RegisterResponse = {
        user: {
          id: 3,
          username: 'minimaluser',
          email: '',
          first_name: '',
          last_name: '',
        },
        token: 'minimal-user-token',
      };

      service.register(minimalRequest).subscribe((response) => {
        expect(response).toEqual(minimalResponse);
        expect(service.isAuthenticated()).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/auth/register/');
      expect(req.request.body).toEqual(minimalRequest);

      req.flush(minimalResponse);
    });

    it('should handle registration errors correctly', () => {
      const errorResponse = {
        error: { error: 'Username already exists' },
        status: 400,
      };

      service.register(mockRegisterRequest).subscribe({
        next: () => fail('Registration should have failed'),
        error: (error) => {
          expect(error.error.error).toBe('Username already exists');
          expect(service.getCurrentUser()).toBeNull();
          expect(service.isAuthenticated()).toBe(false);
        },
      });

      const req = httpMock.expectOne('http://localhost:8000/api/auth/register/');
      req.flush(errorResponse.error, { status: errorResponse.status, statusText: 'Bad Request' });
    });

    it('should handle registration network errors', () => {
      service.register(mockRegisterRequest).subscribe({
        next: () => fail('Registration should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(service.getCurrentUser()).toBeNull();
          expect(service.isAuthenticated()).toBe(false);
        },
      });

      const req = httpMock.expectOne('http://localhost:8000/api/auth/register/');
      req.error(new ErrorEvent('Network error'));
    });
  });
});
