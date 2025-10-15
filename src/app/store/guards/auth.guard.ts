import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../api/auth-api.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();
  console.log('Auth guard check:', { isAuthenticated, currentUrl: state.url });

  if (isAuthenticated) {
    return true;
  }

  // Redirect to login page with return url
  console.log('Not authenticated, redirecting to login...');
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
