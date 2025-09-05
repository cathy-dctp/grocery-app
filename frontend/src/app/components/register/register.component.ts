import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/api.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div
            class="mx-auto h-16 w-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6"
          >
            <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 class="text-3xl font-heading font-bold text-neutral-900">Create Your Account</h2>
          <p class="mt-2 text-sm text-neutral-600 font-sans">
            Join us to start organizing your grocery lists
          </p>
        </div>

        <!-- Registration Form -->
        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="space-y-4">
            <!-- Username -->
            <div>
              <label for="username" class="block text-sm font-medium text-neutral-700 font-sans"
                >Username *</label
              >
              <input
                id="username"
                name="username"
                type="text"
                required
                minlength="3"
                [(ngModel)]="formData.username"
                #username="ngModel"
                data-cy="register-username"
                class="mt-1 block w-full px-3 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-sans"
                placeholder="Choose a unique username"
              />
              @if (username.invalid && username.touched) {
                <p class="mt-1 text-sm text-error-600">
                  @if (username.errors?.['required']) {
                    Username is required
                  }
                  @if (username.errors?.['minlength']) {
                    Username must be at least 3 characters
                  }
                </p>
              }
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-neutral-700 font-sans"
                >Email</label
              >
              <input
                id="email"
                name="email"
                type="email"
                [(ngModel)]="formData.email"
                #email="ngModel"
                data-cy="register-email"
                class="mt-1 block w-full px-3 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-sans"
                placeholder="your@email.com (optional)"
              />
              @if (email.invalid && email.touched) {
                <p class="mt-1 text-sm text-error-600">Please enter a valid email address</p>
              }
            </div>

            <!-- First Name -->
            <div>
              <label for="firstName" class="block text-sm font-medium text-neutral-700 font-sans"
                >First Name</label
              >
              <input
                id="firstName"
                name="firstName"
                type="text"
                [(ngModel)]="formData.first_name"
                data-cy="register-first-name"
                class="mt-1 block w-full px-3 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-sans"
                placeholder="Your first name (optional)"
              />
            </div>

            <!-- Last Name -->
            <div>
              <label for="lastName" class="block text-sm font-medium text-neutral-700 font-sans"
                >Last Name</label
              >
              <input
                id="lastName"
                name="lastName"
                type="text"
                [(ngModel)]="formData.last_name"
                data-cy="register-last-name"
                class="mt-1 block w-full px-3 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-sans"
                placeholder="Your last name (optional)"
              />
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-medium text-neutral-700 font-sans"
                >Password *</label
              >
              <input
                id="password"
                name="password"
                type="password"
                required
                [(ngModel)]="formData.password"
                #password="ngModel"
                data-cy="register-password"
                class="mt-1 block w-full px-3 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-sans"
                placeholder="Create a secure password"
              />
              @if (password.invalid && password.touched) {
                <p class="mt-1 text-sm text-error-600">Password is required</p>
              }
            </div>

            <!-- Confirm Password -->
            <div>
              <label
                for="confirmPassword"
                class="block text-sm font-medium text-neutral-700 font-sans"
                >Confirm Password *</label
              >
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                [(ngModel)]="confirmPassword"
                #confirmPwd="ngModel"
                data-cy="register-confirm-password"
                class="mt-1 block w-full px-3 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-sans"
                placeholder="Confirm your password"
              />
              @if (confirmPwd.touched && formData.password !== confirmPassword) {
                <p class="mt-1 text-sm text-error-600">Passwords do not match</p>
              }
            </div>
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div
              class="bg-error-50 border border-error-200 rounded-xl p-4"
              data-cy="register-error"
            >
              <div class="flex">
                <svg
                  class="h-5 w-5 text-error-400 mt-0.5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p class="text-sm text-error-800 font-sans">{{ errorMessage() }}</p>
              </div>
            </div>
          }

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              [disabled]="
                !registerForm.form.valid || isLoading() || formData.password !== confirmPassword
              "
              data-cy="register-submit"
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-heading"
            >
              @if (isLoading()) {
                <svg class="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating Account...
              } @else {
                Create Account
              }
            </button>
          </div>

          <!-- Login Link -->
          <div class="text-center">
            <p class="text-sm text-neutral-600 font-sans">
              Already have an account?
              <a
                [routerLink]="['/login']"
                class="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                Sign in here
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  formData: RegisterRequest = {
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
  };

  confirmPassword = '';
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.formData.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Clean up empty optional fields
    const registrationData: RegisterRequest = {
      username: this.formData.username,
      password: this.formData.password,
    };

    if (this.formData.email?.trim()) {
      registrationData.email = this.formData.email;
    }
    if (this.formData.first_name?.trim()) {
      registrationData.first_name = this.formData.first_name;
    }
    if (this.formData.last_name?.trim()) {
      registrationData.last_name = this.formData.last_name;
    }

    this.authService.register(registrationData).subscribe({
      next: () => {
        this.router.navigate(['/lists']);
      },
      error: (error) => {
        this.isLoading.set(false);
        let message = 'Registration failed. Please try again.';

        if (error.error?.error) {
          if (Array.isArray(error.error.error)) {
            message = error.error.error.join(' ');
          } else {
            message = error.error.error;
          }
        } else if (error.message) {
          message = error.message;
        }

        this.errorMessage.set(message);
      },
    });
  }
}
