import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  ActivatedRoute,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanActivateChild,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';
import { User } from '../models';

// Functional auth guard for newer Angular versions
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const storedUser = localStorage.getItem('current_user');
  const storedToken = localStorage.getItem('auth_token');
  const hasStoredCredentials = !!(storedUser && storedToken);
  
  // If we have stored credentials, assume authenticated
  if (hasStoredCredentials) {
    return true;
  }
  
  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      const isAuthenticated = !!user;
      
      if (!isAuthenticated) {
        router.navigate(['/auth/login']);
        return false;
      }
      
      return true;
    })
  );
};

// Class-based auth guard for backward compatibility
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkAuth(route);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkAuth(childRoute);
  }

  private checkAuth(route: ActivatedRouteSnapshot): Observable<boolean> {
    // First check the local storage for stored user data as a quick check
    const storedUser = localStorage.getItem('current_user');
    const storedToken = localStorage.getItem('auth_token');
    const hasStoredCredentials = !!(storedUser && storedToken);
    
    // Helper function for navigation with consistent error handling
    const navigateTo = (commands: any[], extras: any = {}): Observable<boolean> => {
      console.log('AuthGuard - Navigating to:', commands[0]);
      
      // For critical redirections like dashboard, use direct window location
      // to avoid any Angular router complications with authentication state
      if (commands[0] === '/dashboard' || commands[0] === 'dashboard') {
        window.location.href = '/dashboard';
        return of(false);
      }
      
      return new Observable<boolean>(subscriber => {
        this.router.navigate(commands, { 
          ...extras,
          replaceUrl: true 
        }).then(
          () => {
            console.log('AuthGuard - Navigation successful to:', commands);
            subscriber.next(false);
            subscriber.complete();
          },
          (error) => {
            console.error('AuthGuard - Navigation error:', error);
            subscriber.next(false);
            subscriber.complete();
          }
        );
      });
    };

    const currentUrl = this.router.routerState.snapshot.url.split('?')[0]; 
    const isLoginPage = currentUrl.includes('/auth/login');
    const returnUrl = route.queryParams['returnUrl'] || '/dashboard';
    
    // Fast path: if we have stored credentials and we're on login page, go directly to dashboard
    if (hasStoredCredentials && isLoginPage) {
      console.log('AuthGuard - User has stored credentials, fast path to dashboard');
      return navigateTo(['/dashboard']);
    }
    
    // Get the current user and determine authentication status
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap((user: User | null) => {
        const isAuthenticated = !!user || hasStoredCredentials;
        
        console.log('AuthGuard - Current URL:', currentUrl);
        console.log('AuthGuard - User:', user);
        console.log('AuthGuard - Has stored credentials:', hasStoredCredentials);
        console.log('AuthGuard - isAuthenticated:', isAuthenticated);
        console.log('AuthGuard - isLoginPage:', isLoginPage);
        
        // If user is authenticated and trying to access login page, redirect to dashboard
        if (isAuthenticated && isLoginPage) {
          console.log('AuthGuard - User is authenticated, redirecting to dashboard');
          return navigateTo(['/dashboard']);
        }
        
        // If user is not authenticated and not on login page, redirect to login
        if (!isAuthenticated && !isLoginPage) {
          console.log('AuthGuard - Not authenticated, redirecting to login');
          return navigateTo(['/auth/login'], {
            queryParams: { returnUrl: currentUrl }
          });
        }
        
        // If user is not authenticated and on login page, allow access
        if (!isAuthenticated && isLoginPage) {
          console.log('AuthGuard - Allowing access to login page');
          return of(true);
        }
        
        // Check if email is verified (only for authenticated users with user object)
        if (user && !user.isVerified && !currentUrl.includes('/auth/verify-email')) {
          console.log('AuthGuard - Email not verified, redirecting to verification');
          return navigateTo(['/auth/verify-email'], {
            queryParams: { email: user.email }
          });
        }
        
        // Check if route is restricted by role
        const requiredRoles = route.data['roles'] as Role[];
        if (user && requiredRoles && requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.some((role) =>
            this.authService.hasRole(role)
          );
          
          if (!hasRequiredRole) {
            console.log('AuthGuard - Unauthorized access, redirecting to unauthorized');
            return navigateTo(['/unauthorized']);
          }
        }
        
        // Allow access for authenticated users to non-login pages
        console.log('AuthGuard - Access granted');
        return of(true);
      })
    );
  }
}
