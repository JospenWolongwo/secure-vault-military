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
import { Role } from '../models/role.model';

/**
 * Role-based access control guard.
 * Protects routes based on user roles.
 */
@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.checkRole(route);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.checkRole(childRoute);
  }

  private checkRole(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        // Get roles from route data
        const requiredRoles = route.data['roles'] as Role[];

        // If no roles are specified, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
          return true;
        }

        // Check if user has any of the required roles
        const hasRequiredRole = requiredRoles.some((role) =>
          this.authService.hasRole(role)
        );

        if (!hasRequiredRole) {
          // User doesn't have required role, redirect to unauthorized or home
          this.router.navigate(['/unauthorized']);
          return false;
        }

        // User has required role
        return true;
      })
    );
  }
}
