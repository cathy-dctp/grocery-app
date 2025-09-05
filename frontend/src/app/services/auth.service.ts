import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of, map } from 'rxjs';
import { AuthUser, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = this.getApiUrl();
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  public isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private getApiUrl(): string {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }
    return '/api';
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');

    if (userStr && token) {
      try {
        const user: AuthUser = JSON.parse(userStr);
        user.token = token;
        this.currentUserSubject.next(user);
        this.isAuthenticated.set(true);
      } catch (error) {
        // If localStorage data is corrupted, clear it
        console.warn('Corrupted user data in localStorage, clearing...', error);
        this.clearUserData();
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login/`, credentials).pipe(
      tap((response) => {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('authToken', response.token);
        const userWithToken = { ...response.user, token: response.token };
        this.currentUserSubject.next(userWithToken);
        this.isAuthenticated.set(true);
      }),
      catchError((error) => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register/`, userData).pipe(
      tap((response) => {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('authToken', response.token);
        const userWithToken = { ...response.user, token: response.token };
        this.currentUserSubject.next(userWithToken);
        this.isAuthenticated.set(true);
      }),
      catchError((error) => {
        console.error('Registration error:', error);
        throw error;
      })
    );
  }

  logout(): Observable<null> {
    const token = this.getAuthToken();
    if (!token) {
      this.clearUserData();
      return of(null);
    }

    return this.http.post<null>(`${this.apiUrl}/auth/logout/`, {}).pipe(
      tap(() => this.clearUserData()),
      catchError((_error) => {
        // Even if logout fails on server, clear local data
        this.clearUserData();
        return of(null);
      })
    );
  }

  private clearUserData(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  checkAuthStatus(): Observable<boolean> {
    const token = this.getAuthToken();
    if (!token) {
      return of(false);
    }

    return this.http.get(`${this.apiUrl}/auth/me/`).pipe(
      map(() => {
        this.isAuthenticated.set(true);
        return true;
      }),
      catchError(() => {
        this.clearUserData();
        return of(false);
      })
    );
  }
}
