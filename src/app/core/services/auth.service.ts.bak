import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { StorageService } from './storage.service';

export interface AuthResponse {
  token?: string;
  refreshToken?: string;
  user?: User;
}

export interface User {
  id: string;
  email: string;
  role: string;
  roles?: string[];
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
    const storedUser = this.storageService.getItem<User>(this.USER_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
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
    return this.storageService.getItem<string>(this.AUTH_TOKEN_KEY);
  }

  /**
   * Update user's password using a reset token
   * @param token Password reset token
   * @param newPassword New password
   */
  updatePassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Handle HTTP errors
   * @param error The error response
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Handle successful authentication
   * @param response The authentication response
   */
  private handleAuthSuccess(response: AuthResponse): void {
    if (response.token) {
      this.storageService.setItem(this.AUTH_TOKEN_KEY, response.token);
    }
    if (response.refreshToken) {
      this.storageService.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
    if (response.user) {
      this.storageService.setItem(this.USER_KEY, response.user);
      this.currentUserSubject.next(response.user);
    }
  }

  /**
   * Logout the current user
   */
  public logout(): void {
    // Remove user from local storage
    this.storageService.removeItem(this.USER_KEY);
    this.storageService.removeItem(this.AUTH_TOKEN_KEY);
    this.storageService.removeItem(this.REFRESH_TOKEN_KEY);
    
    // Update the current user subject
    this.currentUserSubject.next(null);
    
    // Navigate to login page
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get the refresh token
   */
  public getRefreshToken(): string | null {
    return this.storageService.getItem<string>(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Request a password reset email
   * @param email The user's email address
   */
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, { email })
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Refresh the authentication token
   */
  refreshToken(): Observable<{ token: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }
    
    return this.http.post<{ token: string; refreshToken: string }>(
      `${this.apiUrl}/refresh-token`,
      { refreshToken }
    ).pipe(
      tap(tokens => {
        if (tokens?.token) {
          this.storageService.setItem(this.AUTH_TOKEN_KEY, tokens.token);
        }
        if (tokens?.refreshToken) {
          this.storageService.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
        }
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if the current user has a specific role
   * @param role The role to check for
   */
  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user?.role === role || user?.roles?.includes(role) || false;
  }

  /**
   * Check if the current user has any of the specified roles
   * @param roles The roles to check for
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Update the current user's information
   * @param user The updated user object
   */
  updateUser(user: User): void {
    if (user) {
      this.storageService.setItem(this.USER_KEY, user);
      this.currentUserSubject.next(user);
    }
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
      map((response) => {
        if (!response.user) {
          throw new Error('No user data in response');
        }
        return response.user;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Login with email and password
   * @param email User's email
   * @param password User's password
   * @param rememberMe Whether to remember the user
   */
  login(email: string, password: string, rememberMe: boolean = false): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        this.handleAuthSuccess(response);
        if (rememberMe) {
          // Store remember me token in local storage
          this.storageService.setItem('remember_me', 'true');
        }
      }),
      map((response) => {
        if (!response.user) {
          throw new Error('No user data in response');
        }
        return response.user;
      }),
      catchError(error => this.handleError(error))
    );
  }
}
