import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.username.trim() || !this.password.trim()) {
      this.error.set('Username and password are required');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService
      .login({
        username: this.username.trim(),
        password: this.password.trim(),
      })
      .subscribe({
        next: (response) => {
          try {
            console.log('Login successful:', response.user.username);
            this.loading.set(false);
            this.router.navigate(['/lists']);
          } catch (error) {
            console.error('Login failed:', error);
            this.loading.set(false);
            this.error.set('Login failed. Please try again.');
          }
        },
        error: (err) => {
          console.error('Login failed:', err);
          this.loading.set(false);
          if (err.status === 401) {
            this.error.set('Invalid username or password');
          } else {
            this.error.set('Login failed. Please try again.');
          }
        },
      });
  }

  // Demo login buttons for testing
  loginAsJohn() {
    this.username = 'john_doe';
    this.password = 'password123';
    this.onSubmit();
  }

  loginAsJane() {
    this.username = 'jane_smith';
    this.password = 'password123';
    this.onSubmit();
  }
}
