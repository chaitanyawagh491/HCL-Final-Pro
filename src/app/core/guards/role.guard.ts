import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/erp.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as UserRole[] | undefined;
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (auth.hasRole(allowedRoles)) {
    return true;
  }

  // Not authorized for this module, redirect to dashboard or profile
  const user = auth.currentUser();
  if (user?.role === 'Employee') {
    return router.parseUrl('/hr/employees/' + user.employeeId);
  }
  return router.parseUrl('/dashboard');
};

