import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest, RegisterResponse } from '../../models/api.models';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: Router;

  const mockRegisterResponse: RegisterResponse = {
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    },
    token: 'fake-token',
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router);

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form data', () => {
    expect(component.formData.username).toBe('');
    expect(component.formData.password).toBe('');
    expect(component.formData.email).toBe('');
    expect(component.formData.first_name).toBe('');
    expect(component.formData.last_name).toBe('');
    expect(component.confirmPassword).toBe('');
  });

  it('should initialize with loading and error signals as false/empty', () => {
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('');
  });

  describe('Form Validation', () => {
    it('should display error when passwords do not match', () => {
      component.formData.password = 'password123';
      component.confirmPassword = 'different';

      component.onSubmit();

      expect(component.errorMessage()).toBe('Passwords do not match');
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });
  });

  describe('Registration Success', () => {
    beforeEach(() => {
      component.formData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      };
      component.confirmPassword = 'password123';
    });

    it('should register with full data and navigate to lists', () => {
      spyOn(mockRouter, 'navigate');
      mockAuthService.register.and.returnValue(of(mockRegisterResponse));

      component.onSubmit();

      expect(component.isLoading()).toBe(true);
      expect(component.errorMessage()).toBe('');

      const expectedRequest: RegisterRequest = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      };

      expect(mockAuthService.register).toHaveBeenCalledWith(expectedRequest);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/lists']);
    });

    it('should register with minimal data (only username and password)', () => {
      component.formData = {
        username: 'minimaluser',
        password: 'password123',
        email: '',
        first_name: '',
        last_name: '',
      };
      component.confirmPassword = 'password123';

      mockAuthService.register.and.returnValue(of(mockRegisterResponse));

      component.onSubmit();

      const expectedRequest: RegisterRequest = {
        username: 'minimaluser',
        password: 'password123',
      };

      expect(mockAuthService.register).toHaveBeenCalledWith(expectedRequest);
    });

    it('should clean up empty optional fields', () => {
      component.formData = {
        username: 'testuser',
        password: 'password123',
        email: '   ',
        first_name: 'Test',
        last_name: '   ',
      };
      component.confirmPassword = 'password123';

      mockAuthService.register.and.returnValue(of(mockRegisterResponse));

      component.onSubmit();

      const expectedRequest: RegisterRequest = {
        username: 'testuser',
        password: 'password123',
        first_name: 'Test',
      };

      expect(mockAuthService.register).toHaveBeenCalledWith(expectedRequest);
    });
  });

  describe('Registration Errors', () => {
    beforeEach(() => {
      component.formData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      };
      component.confirmPassword = 'password123';
    });

    it('should handle single error message', () => {
      const errorResponse = {
        error: { error: 'Username already exists' },
      };

      mockAuthService.register.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Username already exists');
    });

    it('should handle array of error messages', () => {
      const errorResponse = {
        error: { error: ['Username is required', 'Password too short'] },
      };

      mockAuthService.register.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Username is required Password too short');
    });

    it('should handle generic error message', () => {
      const errorResponse = {
        message: 'Network error',
      };

      mockAuthService.register.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Network error');
    });

    it('should handle unknown error format', () => {
      const errorResponse = {};

      mockAuthService.register.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Registration failed. Please try again.');
    });
  });

  describe('UI Elements', () => {
    it('should have required form elements', () => {
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('[data-cy="register-username"]')).toBeTruthy();
      expect(compiled.querySelector('[data-cy="register-email"]')).toBeTruthy();
      expect(compiled.querySelector('[data-cy="register-first-name"]')).toBeTruthy();
      expect(compiled.querySelector('[data-cy="register-last-name"]')).toBeTruthy();
      expect(compiled.querySelector('[data-cy="register-password"]')).toBeTruthy();
      expect(compiled.querySelector('[data-cy="register-confirm-password"]')).toBeTruthy();
      expect(compiled.querySelector('[data-cy="register-submit"]')).toBeTruthy();
    });

    it('should display error message when present', () => {
      component.errorMessage.set('Test error message');
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('[data-cy="register-error"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error message');
    });

    it('should show loading state in submit button', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('[data-cy="register-submit"]');
      expect(submitButton.textContent).toContain('Creating Account...');
    });

    it('should have link to login page', () => {
      const loginLink = fixture.nativeElement.querySelector('a');
      expect(loginLink).toBeTruthy();
      expect(loginLink.textContent).toContain('Sign in here');
    });
  });
});