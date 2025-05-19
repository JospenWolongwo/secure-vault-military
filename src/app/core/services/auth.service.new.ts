import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { User } from '../models/user.model';
import { StorageService } from './storage.service';

interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

interface ErrorResponse {
  message: string;
  errors?: { [key: string]: string[] };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private router: Router
  ) {
    // Initialize the current user from storage if available
    const storedUser = this.storageService.getItem(this.USER_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  /**
   * Get the current user value
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get the authentication token
   */
  public get token(): string | null {
    return this.storageService.getItem(this.AUTH_TOKEN_KEY);
  }

  /**
   * Get the refresh token
   */
  private get refreshToken(): string | null {
    return this.storageService.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if the user is authenticated
   */
  public get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUserValue;
  }

  /**
   * Register a new user
   * @param userData User registration data
   */
  register(userData: any): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      map((response) => response.user),
      catchError(this.handleError)
    );
  }

  /**
   * Login with email and password
   * @param email User's email
   * @param password User's password
   * @param rememberMe Whether to remember the user
   */
  login(email: string, password: string, rememberMe: boolean = false): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          this.handleAuthSuccess(response);
          if (rememberMe) {
            this.storageService.setItem('remember_me', 'true');
          }
        }),
        map((response) => response.user),
        catchError(this.handleError)
      );
  }

  /**
   * Logout the current user
   */
  logout(): void {
    // Call the logout API to invalidate the token
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.clearAuthData(),
      error: () => this.clearAuthData(),
    });
  }

  /**
   * Request password reset
   * @param email User's email
   */
  forgotPassword(email: string): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/forgot-password`, { email })
      .pipe(catchError(this.handleError));
  }

  /**
   * Reset password with token
   * @param token Password reset token
   * @param password New password
   * @param passwordConfirmation Password confirmation
   */
  resetPassword(
    token: string,
    password: string,
    passwordConfirmation: string
  ): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/reset-password`, {
        token,
        password,
        password_confirmation: passwordConfirmation,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Refresh the authentication token
   */
  refreshTokenRequest(): Observable<AuthResponse> {
    if (!this.refreshToken) {
      this.clearAuthData();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh-token`, {
        refresh_token: this.refreshToken,
      })
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
        catchError((error) => {
          // If token refresh fails, clear auth data and redirect to login
          this.clearAuthData();
          this.router.navigate(['/auth/login']);
          return throwError(() => error);
        })
      );
  }

  /**
   * Check if the current user has a specific role
   * @param role Role to check
   */
  hasRole(role: string): boolean {
    return this.currentUserValue?.role === role;
  }

  /**
   * Check if the current user has any of the specified roles
   * @param roles Roles to check
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.currentUserValue?.role === role);
  }

  /**
   * Update the current user's data
   * @param user Updated user data
   */
  updateUser(user: User): void {
    this.storageService.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Handle successful authentication
   * @private
   */
  private handleAuthSuccess(response: AuthResponse): void {
    const { user, token, refreshToken } = response;
    
    // Store user details and tokens in storage
    this.storageService.setItem(this.USER_KEY, JSON.stringify(user));
    this.storageService.setItem(this.AUTH_TOKEN_KEY, token);
    
    if (refreshToken) {
      this.storageService.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    
    // Update the current user
    this.currentUserSubject.next(user);
  }

  /**
   * Clear all authentication data
   * @private
   */
  private clearAuthData(): void {
    // Remove auth data from storage
    this.storageService.removeItem(this.USER_KEY);
    this.storageService.removeItem(this.AUTH_TOKEN_KEY);
    this.storageService.removeItem(this.REFRESH_TOKEN_KEY);
    this.storageService.removeItem('remember_me');
    
    // Reset the current user
    this.currentUserSubject.next(null);
    
    // Navigate to login
    this.router.navigate(['/auth/login']);
  }

  /**
   * Handle HTTP errors
   * @private
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      const errorResponse = error.error as ErrorResponse;
      errorMessage = errorResponse?.message || error.message;
    }
    
    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      errors: (error.error as any)?.errors,
    }));
  }
}
