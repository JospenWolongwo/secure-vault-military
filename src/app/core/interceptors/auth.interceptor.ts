import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpHeaders,
  HttpContext
} from '@angular/common/http';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

import { AuthService } from '../services/auth.service';
import { environment } from '@environments/environment';

// Skip auth for these URLs
const SKIP_AUTH = [
  'assets/',
  'i18n/',
  environment.services.supabase.url,
  // Add other URLs that don't require auth
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Skip auth for certain URLs
    if (this.shouldSkipAuth(request.url)) {
      return next.handle(request);
    }

    // Add auth token to request
    const authReq = this.addAuthToken(request);

    // Handle the request
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized responses
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }

        // Handle 403 Forbidden responses
        if (error.status === 403) {
          this.handle403Error();
          return throwError(() => error);
        }

        // Handle other errors
        return this.handleError(error);
      })
    );
  }


  /**
   * Check if the request URL should skip authentication
   */
  private shouldSkipAuth(url: string): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }
    return SKIP_AUTH.some(path => url.includes(path));
  }

  /**
   * Add authorization token to request headers
   */
  private addAuthToken(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.authService.token;
    
    if (!token) {
      return request;
    }

    // Clone the request and add the authorization header
    return request.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Handle 401 Unauthorized errors
   */
  private handle401Error(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // If we're already refreshing, wait for the new token
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap(token => next.handle(this.addAuthToken(request)))
      );
    }

    // Start the refresh process
    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const refreshToken = this.authService.getRefreshToken();
    
    if (!refreshToken) {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
      return throwError(() => new Error('No refresh token available'));
    }

    // Use a type assertion to handle the response from refreshToken()
    return (this.authService.refreshToken() as Observable<{ token: string; refreshToken: string }>).pipe(
      switchMap((response) => {
        this.isRefreshing = false;
        if (response?.token) {
          this.refreshTokenSubject.next(response.token);
          return next.handle(this.addAuthToken(request));
        }
        throw new Error('No valid token in refresh response');
      }),
      catchError((error: any) => {
        this.isRefreshing = false;
        this.authService.logout();
        
        // Get the current route to redirect back after login
        const currentUrl = this.router.routerState.snapshot.url;
        const returnUrl = currentUrl !== '/' ? `?returnUrl=${encodeURIComponent(currentUrl)}` : '';
        
        // Navigate to login page
        this.router.navigate(['/auth/login' + returnUrl]);
        return throwError(() => error);
      })
    );
  }

  /**
   * Handle 403 Forbidden errors
   */
  private handle403Error(): void {
    // Show access denied message
    // this.notificationService.error('Access denied. You do not have permission to access this resource.');
    
    // Navigate to access denied page or home
    if (this.router.url !== '/') {
      this.router.navigate(['/']);
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      
      // Handle specific error codes
      switch (error.status) {
        case 400:
          errorMessage = 'Bad Request';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 500:
          errorMessage = 'Internal Server Error';
          break;
        case 503:
          errorMessage = 'Service Unavailable';
          break;
      }
    }
    
    // Log the error (you might want to use a logging service here)
    console.error(errorMessage);
    
    // Return an observable with a user-facing error message
    return throwError(() => new Error(errorMessage));
  }
}
