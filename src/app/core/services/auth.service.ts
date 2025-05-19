import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';

import { User } from '@app/core/models';
import { StorageService } from './storage.service';
import { SupabaseService } from './supabase.service';

interface AuthResponse {
  user: User | null;
  session?: any;
  token?: string;
  refreshToken?: string;
  requiresEmailConfirmation?: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Key names used for storage
  private readonly AUTH_TOKEN_KEY = 'auth_token'; // Changed from 'sb:token' to avoid conflicts
  private readonly REFRESH_TOKEN_KEY = 'refresh_token'; // Changed from 'sb:refresh_token' to avoid conflicts
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));

  constructor(
    private supabase: SupabaseService,
    private storageService: StorageService,
    private router: Router
  ) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    this.supabase.getSession().subscribe({
      next: ({ data, error }) => {
        if (error) {
          console.error('Error getting session:', error);
          this.clearAuthData();
          return;
        }

        const session = data?.session;
        if (session?.user) {
          const user = this.mapSupabaseUserToUser(session.user);
          this.handleSuccessfulAuth(user, session);
        } else {
          this.clearAuthData();
        }
      },
      error: (error: any) => {
        console.error('Error initializing auth state:', error);
        this.clearAuthData();
      }
    });
  }

  private clearAuthData(): void {
    try {
      this.storageService.removeItem(this.AUTH_TOKEN_KEY);
      this.storageService.removeItem(this.REFRESH_TOKEN_KEY);
      this.storageService.removeItem(this.USER_KEY);
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      this.currentUserSubject.next(null);
    }
  }

  private handleSuccessfulAuth(user: User, session: any): void {
    try {
      // When session is null (like during registration), we don't try to store tokens
      if (session) {
        // Store tokens in our storage service, not directly in localStorage to avoid lock conflicts
        if (session.access_token) {
          this.storageService.setItem(this.AUTH_TOKEN_KEY, session.access_token);
        }
        if (session.refresh_token) {
          this.storageService.setItem(this.REFRESH_TOKEN_KEY, session.refresh_token);
        }
      }
      
      // Always store the user data
      this.storageService.setItem(this.USER_KEY, JSON.stringify(user));
      
      // Update the authentication state
      this.currentUserSubject.next(user);
      
      console.log('AuthService - User data processed:', user.email);
    } catch (error) {
      console.error('Error handling successful auth:', error);
      this.clearAuthData();
      throw error;
    }
  }

  private mapSupabaseUserToUser(user: any): User {
    const userMetadata = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email || '',
      firstName: userMetadata.first_name || user['firstName'] || '',
      lastName: userMetadata.last_name || user['lastName'] || '',
      fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      role: user['role'] || userMetadata.role || 'user',
      militaryId: user['militaryId'] || userMetadata.military_id || userMetadata['militaryId'] || '',
      rank: user['rank'] || userMetadata.rank || '',
      unit: user['unit'] || userMetadata.unit || '',
      isActive: true,
      user_metadata: userMetadata,
      email_confirmed_at: user.email_confirmed_at,
      isVerified: !!user.email_confirmed_at || user['isVerified'] === true,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString()
    };
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  public hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user ? user.role === role : false;
  }

  get token(): string | null {
    return this.storageService.getItem<string>(this.AUTH_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.storageService.getItem<string>(this.REFRESH_TOKEN_KEY);
  }

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

        this.storageService.setItem(this.AUTH_TOKEN_KEY, access_token);
        this.storageService.setItem(this.REFRESH_TOKEN_KEY, refresh_token);

        return {
          token: access_token,
          refreshToken: refresh_token
        };
      })
    );
  }

  forgotPassword(email: string): Observable<{ error: Error | null }> {
    return this.supabase.resetPassword(email);
  }

  resetPassword(token: string, newPassword: string): Observable<{ error: Error | null }> {
    return this.supabase.resetPasswordWithToken(token, newPassword);
  }

  updatePassword(token: string, newPassword: string): Observable<{ error: Error | null }> {
    return this.supabase.updateUserPassword(token, newPassword);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    console.log('AuthService - Starting login process for:', email);
    
    // Create a new observable to manage the login flow
    return new Observable<AuthResponse>(subscriber => {
      // Attempt to sign in without clearing data first - this avoids lock conflicts
      this.supabase.signIn(email, password).subscribe({
        next: async ({ user, session, error }) => {
          if (error) {
            console.error('AuthService - Login error:', error);
            this.clearAuthData();
            subscriber.error(error);
            return;
          }

          if (!user || !session) {
            const errorMsg = 'No user or session returned from sign in';
            console.error('AuthService -', errorMsg);
            this.clearAuthData();
            subscriber.error(new Error(errorMsg));
            return;
          }

          try {
            console.log('AuthService - Login successful, processing user data');
            const userMetadata = user.user_metadata || {};
            const nameFromEmail = email.split('@')[0];
            const userData: User = {
              id: user.id,
              email: user.email || email,
              firstName: user.firstName || userMetadata['first_name'] || (userMetadata['name'] ? userMetadata['name'].split(' ')[0] : '') || nameFromEmail,
              lastName: user.lastName || userMetadata['last_name'] || (userMetadata['name'] ? userMetadata['name'].split(' ').slice(1).join(' ') : '') || '',
              fullName: user.fullName || userMetadata['full_name'] || `${user.firstName || ''} ${user.lastName || ''}`.trim() || nameFromEmail || 'User',
              role: user.role || userMetadata['role'] || 'user',
              militaryId: user.militaryId || userMetadata['military_id'] || '',
              rank: user.rank || userMetadata['rank'] || '',
              unit: user.unit || userMetadata.unit || '',
              isActive: true,
              user_metadata: userMetadata,
              email_confirmed_at: user.email_confirmed_at,
              isVerified: !!user.email_confirmed_at || user['isVerified'] === true,
              createdAt: user.createdAt || new Date().toISOString(),
              updatedAt: user.updatedAt || new Date().toISOString()
            };

            const response: AuthResponse = {
              user: userData,
              session,
              token: session.access_token,
              refreshToken: session.refresh_token || '',
              requiresEmailConfirmation: !user.email_confirmed_at
            };

            // Handle successful authentication
            this.handleSuccessfulAuth(userData, session);
            console.log('AuthService - Login successful, authentication state updated');
            subscriber.next(response);
            subscriber.complete();
          } catch (error) {
            console.error('Error processing login:', error);
            this.clearAuthData();
            subscriber.error(error);
          }
        },
        error: (error: any) => {
          console.error('Login error:', error);
          this.clearAuthData();
          subscriber.error(error);
        }
      });
    }).pipe(
      catchError((error: any) => {
        return this.handleError(error);
      })
    );
  }

  logout(): Observable<{ error: any }> {
    return this.supabase.signOut().pipe(
      tap({
        next: () => {
          this.clearAuthData();
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          console.error('Logout error:', error);
          this.clearAuthData();
          this.router.navigate(['/auth/login']);
        },
      })
    );
  }

  register(userData: any): Observable<AuthResponse> {
    console.log('Registering user with data:', userData);

    if (userData.password !== userData.confirmPassword) {
      console.error('Password mismatch:', userData);
      return throwError(() => new Error('AUTH.REGISTER.ERRORS.PASSWORD_MISMATCH'));
    }

    const { email, password, confirmPassword, ...profileData } = userData;

    this.storageService.removeItem(this.AUTH_TOKEN_KEY);
    this.storageService.removeItem(this.REFRESH_TOKEN_KEY);

    const attemptRegistration = async (): Promise<AuthResponse> => {
      try {
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

        const userData: User = {
          id: user.id,
          email: user.email || email,
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          fullName: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
          role: 'user',
          isVerified: false,
          militaryId: profileData.militaryId || '',
          rank: profileData.rank || '',
          unit: profileData.unit || '',
          isActive: true,
          email_confirmed_at: null,
          user_metadata: { ...profileData },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const response: AuthResponse = {
          user: userData,
          session: null,
          token: '',
          refreshToken: '',
          requiresEmailConfirmation: true
        };

        this.handleSuccessfulAuth(userData, null);
        return response;
      } catch (error: unknown) {
        console.error('Registration error:', error);

        if (error instanceof Error && (error.message.includes('NavigatorLockManager') || error.message.includes('lock') || error.message.includes('timeout'))) {
          console.log('Retrying registration after lock manager error...');
          await new Promise(resolve => setTimeout(resolve, 500));
          return attemptRegistration();
        }

        throw error;
      }
    };

    return new Observable<AuthResponse>((subscriber) => {
      attemptRegistration()
        .then((result: AuthResponse) => {
          subscriber.next(result);
          subscriber.complete();
        })
        .catch((error: any) => {
          console.error('Registration error:', error);
          this.clearAuthData();
          subscriber.error(error);
        });
    }).pipe(
      catchError((error: any) => {
        return this.handleError(error);
      })
    );
  }



  private handleError(error: any): Observable<never> {
    console.error('AuthService error:', error);
    let errorMessage = 'An error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
