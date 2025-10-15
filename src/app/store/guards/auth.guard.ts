import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../features/auth.store';

export const authGuard: CanActivateFn = async (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const isAuthenticated = authStore.isAuthenticated() || !!localStorage.getItem('refresh_token');
  console.log('Auth guard check:', { isAuthenticated, currentUrl: state.url });

  if (isAuthenticated) {
    return true;
  }

  // Redirect to login page with return url
  console.log('Not authenticated, redirecting to login...');
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
