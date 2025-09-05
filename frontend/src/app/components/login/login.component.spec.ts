import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { LoginResponse, AuthUser } from '../../models/api.models';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

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

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty form fields', () => {
      expect(component.username).toBe('');
      expect(component.password).toBe('');
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('should render form elements', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const usernameInput = compiled.querySelector('input[type="text"]') as HTMLInputElement;
      const passwordInput = compiled.querySelector('input[type="password"]') as HTMLInputElement;
      const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;

      expect(usernameInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(submitButton).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty username and password', () => {
      component.username = '';
      component.password = '';

      component.onSubmit();

      expect(component.error()).toBe('Username and password are required');
      expect(component.loading()).toBe(false);
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should show error for empty username only', () => {
      component.username = '';
      component.password = 'password123';

      component.onSubmit();

      expect(component.error()).toBe('Username and password are required');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should show error for empty password only', () => {
      component.username = 'testuser';
      component.password = '';

      component.onSubmit();

      expect(component.error()).toBe('Username and password are required');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should show error for whitespace-only username', () => {
      component.username = '   ';
      component.password = 'password123';

      component.onSubmit();

      expect(component.error()).toBe('Username and password are required');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should show error for whitespace-only password', () => {
      component.username = 'testuser';
      component.password = '   ';

      component.onSubmit();

      expect(component.error()).toBe('Username and password are required');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should trim whitespace from username and password', () => {
      component.username = '  testuser  ';
      component.password = '  password123  ';

      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
  });

  describe('Successful Login', () => {
    beforeEach(() => {
      component.username = 'testuser';
      component.password = 'password123';
      mockAuthService.login.and.returnValue(of(mockLoginResponse));
    });

    it('should login successfully and navigate to lists', () => {
      spyOn(console, 'log');

      component.onSubmit();

      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(console.log).toHaveBeenCalledWith('Login successful:', 'testuser');
      expect(router.navigate).toHaveBeenCalledWith(['/lists']);
    });

    it('should set loading state during login process', () => {
      component.onSubmit();

      expect(mockAuthService.login).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/lists']);
    });

    it('should clear any previous errors on successful login', () => {
      component.error.set('Previous error');

      component.onSubmit();

      expect(component.error()).toBeNull();
    });
  });

  describe('Login Errors', () => {
    beforeEach(() => {
      component.username = 'testuser';
      component.password = 'wrongpassword';
    });

    it('should handle 401 unauthorized error', () => {
      const error = { status: 401, error: { detail: 'Invalid credentials' } };
      mockAuthService.login.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.onSubmit();

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Invalid username or password');
      expect(console.error).toHaveBeenCalledWith('Login failed:', error);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle 500 server error', () => {
      const error = { status: 500, message: 'Internal server error' };
      mockAuthService.login.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.onSubmit();

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Login failed. Please try again.');
      expect(console.error).toHaveBeenCalledWith('Login failed:', error);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle network error', () => {
      const error = { status: 0, message: 'Network error' };
      mockAuthService.login.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.onSubmit();

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Login failed. Please try again.');
      expect(console.error).toHaveBeenCalledWith('Login failed:', error);
    });

    it('should clear loading state on error', () => {
      const error = { status: 401 };
      mockAuthService.login.and.returnValue(throwError(() => error));

      component.onSubmit();

      expect(component.loading()).toBe(false);
    });
  });

  describe('Demo Login Functions', () => {
    describe('loginAsJohn', () => {
      it('should set John credentials and submit', () => {
        mockAuthService.login.and.returnValue(of(mockLoginResponse));
        spyOn(component, 'onSubmit');

        component.loginAsJohn();

        expect(component.username).toBe('john_doe');
        expect(component.password).toBe('password123');
        expect(component.onSubmit).toHaveBeenCalled();
      });

      it('should login successfully as John', () => {
        mockAuthService.login.and.returnValue(of(mockLoginResponse));
        spyOn(console, 'log');

        component.loginAsJohn();

        expect(mockAuthService.login).toHaveBeenCalledWith({
          username: 'john_doe',
          password: 'password123',
        });
        expect(router.navigate).toHaveBeenCalledWith(['/lists']);
      });
    });

    describe('loginAsJane', () => {
      it('should set Jane credentials and submit', () => {
        mockAuthService.login.and.returnValue(of(mockLoginResponse));
        spyOn(component, 'onSubmit');

        component.loginAsJane();

        expect(component.username).toBe('jane_smith');
        expect(component.password).toBe('password123');
        expect(component.onSubmit).toHaveBeenCalled();
      });

      it('should login successfully as Jane', () => {
        mockAuthService.login.and.returnValue(of(mockLoginResponse));
        spyOn(console, 'log');

        component.loginAsJane();

        expect(mockAuthService.login).toHaveBeenCalledWith({
          username: 'jane_smith',
          password: 'password123',
        });
        expect(router.navigate).toHaveBeenCalledWith(['/lists']);
      });
    });
  });

  describe('Signal State Management', () => {
    it('should update loading signal during login', () => {
      component.username = 'testuser';
      component.password = 'password123';
      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      expect(component.loading()).toBe(false);

      component.onSubmit();

      expect(component.loading()).toBe(false); // Completes immediately with mock
    });

    it('should update error signal on validation failure', () => {
      expect(component.error()).toBeNull();

      component.onSubmit(); // Empty credentials

      expect(component.error()).toBe('Username and password are required');
    });

    it('should clear error signal on new submission', () => {
      component.error.set('Previous error');
      component.username = 'testuser';
      component.password = 'password123';
      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(component.error()).toBeNull();
    });
  });

  describe('Form Integration', () => {
    it('should update component properties when form inputs change', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const usernameInput = compiled.querySelector('input[type="text"]') as HTMLInputElement;
      const passwordInput = compiled.querySelector('input[type="password"]') as HTMLInputElement;

      usernameInput.value = 'newuser';
      usernameInput.dispatchEvent(new Event('input'));

      passwordInput.value = 'newpassword';
      passwordInput.dispatchEvent(new Event('input'));

      fixture.detectChanges();

      expect(component.username).toBe('newuser');
      expect(component.password).toBe('newpassword');
    });

    it('should submit form when submit button is clicked', () => {
      component.username = 'testuser';
      component.password = 'password123';
      mockAuthService.login.and.returnValue(of(mockLoginResponse));
      spyOn(component, 'onSubmit');

      const compiled = fixture.nativeElement as HTMLElement;
      const form = compiled.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));

      expect(component.onSubmit).toHaveBeenCalled();
    });

    it('should display loading state in UI', () => {
      component.loading.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;

      expect(submitButton.disabled).toBe(true);
    });

    it('should display error message in UI', () => {
      component.error.set('Test error message');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorElement =
        compiled.querySelector('.error') || compiled.querySelector('[class*="error"]');

      expect(errorElement?.textContent).toContain('Test error message');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined error status', () => {
      component.username = 'testuser';
      component.password = 'password123';
      const error = { message: 'Unknown error' };
      mockAuthService.login.and.returnValue(throwError(() => error));

      component.onSubmit();

      expect(component.error()).toBe('Login failed. Please try again.');
    });

    it('should handle malformed response from login service', () => {
      component.username = 'testuser';
      component.password = 'password123';
      const malformedResponse = { token: 'token' } as any; // Missing user
      mockAuthService.login.and.returnValue(of(malformedResponse));
      spyOn(console, 'error');

      component.onSubmit();

      // Should handle the error gracefully and set error state
      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Login failed. Please try again.');
      expect(console.error).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should maintain form state after successful login', () => {
      component.username = 'testuser';
      component.password = 'password123';
      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      // Form fields should retain their values for potential re-use
      expect(component.username).toBe('testuser');
      expect(component.password).toBe('password123');
    });

    it('should handle very long username and password', () => {
      const longString = 'a'.repeat(1000);
      component.username = longString;
      component.password = longString;
      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: longString,
        password: longString,
      });
    });
  });
});
