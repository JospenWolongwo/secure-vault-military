import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';

import { SupabaseService } from './supabase.service';
import { StorageService } from './storage.service';
import { User } from '../models/user.model';

export interface AuthResponse {
  token?: string;
  refreshToken?: string;
  user?: User;
  requiresEmailConfirmation?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private readonly AUTH_TOKEN_KEY = 'sb:token';
  private readonly REFRESH_TOKEN_KEY = 'sb:refresh_token';
  private readonly USER_KEY = 'current_user';
  
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
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
   * Check if user is authenticated
   */
  public get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
  
  /**
   * Check if user has specific role
   */
  public hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user ? user.role === role : false;
  }

  /**
   * Get the authentication token
   */
  get token(): string | null {
    return this.storageService.getItem<string>(this.AUTH_TOKEN_KEY);
  }

  /**
   * Get the refresh token from storage
   */
  getRefreshToken(): string | null {
    return this.storageService.getItem<string>(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Refresh the authentication token
   */
  refreshToken(): Observable<{ token: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.supabase.refreshSession().pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data?.session) throw new Error('No session data');

        const { access_token, refresh_token } = data.session;
        
        // Store the new tokens
        if (access_token) {
          this.storageService.setItem(this.AUTH_TOKEN_KEY, access_token);
        }
        if (refresh_token) {
          this.storageService.setItem(this.REFRESH_TOKEN_KEY, refresh_token);
        }

        return {
          token: access_token,
          refreshToken: refresh_token
        };
      })
    );
  }

  /**
   * Request password reset email
   */
  forgotPassword(email: string): Observable<{ error: Error | null }> {
    return this.supabase.resetPassword(email);
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<{ error: Error | null }> {
    return this.supabase.resetPasswordWithToken(token, newPassword);
  }

  /**
   * Update password with token (for password reset flow)
   */
  updatePassword(token: string, newPassword: string): Observable<{ error: Error | null }> {
    return this.supabase.updateUserPassword(token, newPassword);
  }
  
  /**
   * Clean up on service destruction
   */
  ngOnDestroy() {
    this.currentUserSubject.complete();
    this.isAuthenticatedSubject.complete();
  }

  /**
   * Logout user
   */
  logout(): Observable<{ error: Error | null }> {
    return this.supabase.signOut().pipe(
      tap(({ error }) => {
        if (error) {
          console.error('Error during sign out:', error);
        }
        
        // Clear local storage
        this.storageService.removeItem(this.AUTH_TOKEN_KEY);
        this.storageService.removeItem(this.REFRESH_TOKEN_KEY);
        this.storageService.removeItem(this.USER_KEY);
        
        // Update current user subject
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        
        // Navigate to login page
        this.router.navigate(['/auth/login']);
      })
    );
  }

  /**
   * Register a new user
   */
  register(userData: any): Observable<AuthResponse> {
    console.log('Registering user with data:', {
      email: userData.email,
      hasPassword: !!userData.password,
      hasConfirmPassword: !!userData.confirmPassword,
      passwordsMatch: userData.password === userData.confirmPassword
    });
    
    // Double check passwords match (should be handled by form validation)
    if (userData.password !== userData.confirmPassword) {
      console.error('Password mismatch:', {
        password: userData.password,
        confirmPassword: userData.confirmPassword
      });
      return throwError(() => new Error('AUTH.REGISTER.ERRORS.PASSWORD_MISMATCH'));
    }
    
    // Log the complete user data for debugging
    console.log('Registering user with complete data:', {
      email: userData.email,
      hasPassword: !!userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      militaryId: userData.militaryId,
      rank: userData.rank,
      unit: userData.unit
    });
    
    const { email, password, confirmPassword, ...profileData } = userData;
    
    // Clear any existing session data that might cause conflicts
    this.storageService.removeItem(this.AUTH_TOKEN_KEY);
    this.storageService.removeItem(this.REFRESH_TOKEN_KEY);
    
    // Create a promise that resolves after a delay
    const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
    
    const attemptRegistration = async (): Promise<AuthResponse> => {
      try {
        // Add a small delay to help with the lock manager issue
        await delay(100);
        
        // Call signUp and handle the Observable response
        const signUpResult = await this.supabase.signUp(email, password, profileData).toPromise();
        
        if (!signUpResult) {
          throw new Error('AUTH.REGISTER.ERRORS.REGISTRATION_FAILED');
        }
        
        const { user, error } = signUpResult;
        
        if (error) {
          if (error.message.includes('User already registered')) {
            throw new Error('AUTH.REGISTER.ERRORS.EMAIL_TAKEN');
          }
          throw error;
        }
        
        if (!user) {
          throw new Error('AUTH.REGISTER.ERRORS.REGISTRATION_FAILED');
        }
        
        // Don't try to log in automatically - user needs to confirm email first
        const response: AuthResponse = {
          user: {
            id: user.id,
            email: user.email || email, // Ensure we have the email
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            role: 'user',
            isVerified: false,
            militaryId: profileData.militaryId || '',
            rank: profileData.rank || '',
            unit: profileData.unit || ''
          },
          requiresEmailConfirmation: true
        };
        console.log('Registration successful, response:', response);
        return response;
      } catch (error: unknown) {
        console.error('Registration attempt failed:', error);
        
        // Type guard to check if error is an instance of Error
        const isError = (e: unknown): e is Error => e instanceof Error;
        
        // If it's a lock manager error, try one more time
        if (isError(error) && 
            (error.message.includes('NavigatorLockManager') || 
             error.message.includes('lock') || 
             error.message.includes('timeout'))) {
          console.log('Retrying registration after lock manager error...');
          await delay(500); // Longer delay for retry
          return attemptRegistration();
        }
        
        throw error;
      }
    };
    
    // Convert the promise to an observable
    return new Observable<AuthResponse>((subscriber) => {
      attemptRegistration()
        .then((result: AuthResponse) => {
          subscriber.next(result);
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  }

  /**
   * Login user
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.supabase.signIn(email, password).pipe(
      map(({ user, session, error }) => {
        if (error) {
          console.error('Login error:', error);
          throw error instanceof Error ? error : new Error('Login failed');
        }
        
        if (!user) {
          console.error('No user data returned from sign in');
          throw new Error('Login failed: No user data');
        }
        
        try {
          // Store tokens if available
          if (session?.access_token) {
            this.storageService.setItem(this.AUTH_TOKEN_KEY, session.access_token);
          }
          if (session?.refresh_token) {
            this.storageService.setItem(this.REFRESH_TOKEN_KEY, session.refresh_token);
          }
          
          // Log user data for debugging
          console.log('User data from login:', user);
          
          // Create user object with all required properties
          const userMetadata = user.user_metadata || {};
          const firstName = userMetadata.first_name || user['firstName'] || '';
          const lastName = userMetadata.last_name || user['lastName'] || '';
          const role = user['role'] || userMetadata.role || 'user';
          const militaryId = user['militaryId'] || userMetadata.military_id || userMetadata['militaryId'] || '';
          const rank = user['rank'] || userMetadata.rank || '';
          const unit = user['unit'] || userMetadata.unit || '';
          const isVerified = user.email_confirmed_at !== null || user['isVerified'] === true;
          
          const userData: User = {
            id: user.id,
            email: user.email || email,
            firstName,
            lastName,
            role,
            militaryId,
            rank,
            unit,
            isActive: true,
            user_metadata: userMetadata,
            email_confirmed_at: user.email_confirmed_at,
            isVerified
          };
          
          // Store user data
          this.storageService.setItem(this.USER_KEY, userData);
          
          const response: AuthResponse = {
            user: userData,
            token: session?.access_token,
            refreshToken: session?.refresh_token
          };
          
          this.handleAuthentication(response);
          return response;
        } catch (err) {
          console.error('Error processing login response:', err);
          throw new Error('Error processing login');
        }
      }),
      catchError((error) => {
        console.error('AuthService login error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Handle successful authentication
   */
  private handleAuthentication(response: AuthResponse): void {
    if (response.user) {
      // Update current user
      this.currentUserSubject.next(response.user);
      this.isAuthenticatedSubject.next(true);
      
      // Store user data in storage
      this.storageService.setItem(this.USER_KEY, response.user);
      
      // Store tokens if available
      if (response.token) {
        this.storageService.setItem(this.AUTH_TOKEN_KEY, response.token);
      }
      if (response.refreshToken) {
        this.storageService.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
      }
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: any) {
    console.error('Auth error:', error);
    let errorMessage = 'An error occurred';
    
    if (error.error_description) {
      errorMessage = error.error_description;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status && error.status === 400) {
      errorMessage = 'Invalid email or password';
    } else if (error.status && error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
