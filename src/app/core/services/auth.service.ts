import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
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
   * Get the refresh token
   */
  private get refreshToken(): string | null {
    return this.storageService.getItem<string>(this.REFRESH_TOKEN_KEY);
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
            // Store remember me token in local storage
            this.storageService.setItem('remember_me', 'true');
          }
        }),
        map((response) => response.user),
        catchError(this.handleError)
        })
      );
    */
  }

  /**
   * Logout the current user
   */
  logout(): void {
    // Remove user from local storage
    this.storageService.removeItem(this.USER_KEY);
    this.storageService.removeItem(this.AUTH_TOKEN_KEY);
    this.storageService.removeItem(this.REFRESH_TOKEN_KEY);
    this.currentUserSubject.next(null);
    
    // Navigate to login page
    this.router.navigate(['/auth/login']);
  }

  /**
   * Refresh the authentication token
   */
  refreshToken(): Observable<any> {
    const refreshToken = this.storageService.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    // In a real app, this would be an HTTP request to your backend
    return of({
      token: 'new-mock-jwt-token',
      refreshToken: 'new-refresh-token',
    }).pipe(
      tap((tokens) => {
        this.storageService.setItem(this.AUTH_TOKEN_KEY, tokens.token);
        this.storageService.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
      })
    );
  }

  /**
   * Check if the current user has a specific role
   * @param role The role to check for
   */
  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user ? user.role === role : false;
  }

  /**
   * Check if the current user has any of the specified roles
   * @param roles The roles to check for
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserValue;
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Update the current user's information
   * @param user The updated user object
   */
  updateUser(user: User): void {
    this.storageService.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}
