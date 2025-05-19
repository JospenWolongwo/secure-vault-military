import { Injectable, OnDestroy } from '@angular/core';
import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { SUPABASE_CONFIG } from '@environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService implements OnDestroy {
  private supabase: SupabaseClient;
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        autoRefreshToken: SUPABASE_CONFIG.auth.autoRefreshToken,
        persistSession: SUPABASE_CONFIG.auth.persistSession,
        detectSessionInUrl: SUPABASE_CONFIG.auth.detectSessionInUrl,
      },
    });

    // Set up auth state change listener
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.currentUser.next(this.mapSupabaseUserToUser(session.user));
      } else {
        this.currentUser.next(null);
      }
    });
  }

  // Get the current user
  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Sign up a new user
  signUp(email: string, password: string, userData: Partial<User>): Observable<{ user: User | null; error: Error | null }> {
    // Prepare user metadata
    const userMetadata = {
      first_name: userData.firstName || '',
      last_name: userData.lastName || '',
      military_id: userData.militaryId || '',
      rank: userData.rank || '',
      unit: userData.unit || '',
      created_at: new Date().toISOString(),
    };
    
    console.log('Sending user metadata to Supabase:', userMetadata);
    
    return from(
      this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata
        },
      })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) return of({ user: null, error });
        if (data.user) {
          const user = this.mapSupabaseUserToUser(data.user);
          return of({ user, error: null });
        }
        return of({ user: null, error: new Error('No user data returned') });
      })
    );
  }

  // Sign in a user
  signIn(email: string, password: string): Observable<{ user: User | null; session: any | null; error: Error | null }> {
    console.log('SupabaseService - Attempting sign in with email:', email);
    
    return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('SupabaseService - Sign in error:', error);
          return { user: null, session: null, error };
        }
        
        console.log('SupabaseService - Sign in successful, processing user data');
        // Immediately extract the session data to avoid requiring locks later
        const sessionData = {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        };
        
        const user = data.user ? this.mapSupabaseUserToUser(data.user) : null;
        return { 
          user, 
          session: sessionData,
          error: null 
        };
      }),
      catchError((error) => {
        console.error('SupabaseService - Sign in error:', error);
        return of({ 
          user: null, 
          session: null, 
          error: error instanceof Error ? error : new Error('An unknown error occurred during sign in') 
        });
      })
    );
  }

  // Sign out the current user
  signOut(): Observable<{ error: Error | null }> {
    return from(this.supabase.auth.signOut()).pipe(
      map(({ error }) => ({ error }))
    );
  }

  /**
   * Send password reset email
   */
  resetPassword(email: string): Observable<{ error: Error | null }> {
    return from(this.supabase.auth.resetPasswordForEmail(email)).pipe(
      map(({ error }) => ({
        error: error ? new Error(error.message) : null,
      })),
      catchError((error) =>
        of({ error: error instanceof Error ? error : new Error(String(error)) })
      )
    );
  }

  /**
   * Reset password with token
   */
  resetPasswordWithToken(token: string, newPassword: string): Observable<{ error: Error | null }> {
    // In Supabase v2, we first set the session with the token
    return from(this.supabase.auth.setSession({
      access_token: token,
      refresh_token: '' // We don't need refresh token for password reset
    })).pipe(
      // Then update the password
      switchMap(() => from(this.supabase.auth.updateUser({
        password: newPassword
      }))),
      map(({ error }) => ({
        error: error ? new Error(error.message) : null,
      })),
      catchError((error) =>
        of({ error: error instanceof Error ? error : new Error(String(error)) })
      )
    );
  }

  /**
   * Get the current session
   */
  getSession(): Observable<{ data: { session: any } | null; error: Error | null }> {
    return from(this.supabase.auth.getSession()).pipe(
      map(({ data, error }) => ({
        data,
        error: error ? new Error(error.message) : null,
      })),
      catchError((error) =>
        of({
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
        })
      )
    );
  }

  /**
   * Refresh the current session
   */
  refreshSession(): Observable<{ data: { session: any } | null; error: Error | null }> {
    return from(this.supabase.auth.refreshSession()).pipe(
      map(({ data, error }) => ({
        data,
        error: error ? new Error(error.message) : null,
      })),
      catchError((error) =>
        of({
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
        })
      )
    );
  }

  /**
   * Update user password (requires user to be signed in)
   */
  updateUserPassword(token: string, newPassword: string): Observable<{ error: Error | null }> {
    return from(this.supabase.auth.setSession({
      access_token: token,
      refresh_token: '' // We don't need refresh token for password update
    })).pipe(
      // Then update the password
      switchMap(() => from(this.supabase.auth.updateUser({
        password: newPassword
      }))),
      map(({ error }) => ({
        error: error ? new Error(error.message) : null,
      })),
      catchError((error) =>
        of({ error: error instanceof Error ? error : new Error(String(error)) })
      )
    );
  }

  // Update user profile
  updateProfile(userId: string, updates: Partial<User>): Observable<{ user: User | null; error: Error | null }> {
    return from(
      this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
    ).pipe(
      map(({ data, error }) => ({
        user: data && data[0] ? (data[0] as User) : null,
        error,
      }))
    );
  }

  // Get user profile
  getUserProfile(userId: string): Observable<{ user: User | null; error: Error | null }> {
    return from(
      this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    ).pipe(
      map(({ data, error }) => ({
        user: data as User,
        error,
      })),
      catchError((error) => of({ user: null, error }))
    );
  }

  // Upload a file to storage
  uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: { cacheControl?: string; upsert?: boolean }
  ) {
    return this.supabase.storage.from(bucket).upload(path, file, options);
  }

  // Download a file from storage
  downloadFile(bucket: string, path: string) {
    return this.supabase.storage.from(bucket).download(path);
  }

  // Get public URL for a file
  getPublicUrl(bucket: string, path: string) {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // Helper to map Supabase user to our User model
  private mapSupabaseUserToUser(user: any): User {
    // Check if user_metadata exists, if not, try to get it from the raw_user_meta_data
    const userMetadata = user.user_metadata || user.raw_user_meta_data || {};
    
    // Extract first_name and last_name from different possible locations
    const firstName = userMetadata.first_name || userMetadata.firstName || '';
    const lastName = userMetadata.last_name || userMetadata.lastName || '';
    
    return {
      id: user.id,
      email: user.email || '',
      firstName,
      lastName,
      role: userMetadata.role || 'user',
      isVerified: user.email_confirmed_at !== null || user.email_confirmed_at !== undefined,
      militaryId: userMetadata.military_id || userMetadata.militaryId || '',
      rank: userMetadata.rank || '',
      unit: userMetadata.unit || '',
    };
  }

  ngOnDestroy() {
    this.currentUser.complete();
  }
}
