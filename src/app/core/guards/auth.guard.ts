import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanActivateChild,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.checkAuth(route);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.checkAuth(childRoute);
  }

  private checkAuth(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        // Check if user is authenticated
        if (!user) {
          // Not logged in, redirect to login page with the return URL
          const returnUrl = this.router.routerState.snapshot.url || '/dashboard';
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl }
          });
          return false;
        }

        // Check if email is verified
        if (!user.isVerified) {
          // If email is not verified, redirect to email verification page
          this.router.navigate(['/auth/verify-email'], {
            queryParams: { email: user.email }
          });
          return false;
        }

        // Check if route is restricted by role
        const requiredRoles = route.data['roles'] as Role[];
        if (requiredRoles && requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.some((role) =>
            this.authService.hasRole(role)
          );

          if (!hasRequiredRole) {
            // Role not authorized, redirect to home or unauthorized page
            this.router.navigate(['/unauthorized']);
            return false;
          }
        }

        // Authorized
        return true;
      })
    );
  }
}
