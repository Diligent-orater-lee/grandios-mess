import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../features/auth.store';
import { UserType } from '../models';

export const userTypeGuard = (allowedUserTypes: UserType[]): CanActivateFn => {
  return (route, state) => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    const user = authStore.user();
    
    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    // Check if user's type is in the allowed types
    if (allowedUserTypes.includes(user.userType)) {
      return true;
    }

    return router.createUrlTree(['/login']);
  };
};

// Convenience functions for common user type combinations
export const adminOnlyGuard = userTypeGuard([UserType.ADMIN]);
export const adminAndDeliveryGuard = userTypeGuard([UserType.ADMIN, UserType.DELIVERY]);
export const allUsersGuard = userTypeGuard([UserType.ADMIN, UserType.CLIENT, UserType.DELIVERY]);
export const clientOnlyGuard = userTypeGuard([UserType.CLIENT]);
