import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { AuthService } from '../api/auth-api.service';
import { AuthResponse, AuthState, LoginRequest, RegisterRequest, User, UserType } from '../models';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';

// Navigation helper functions
function navigateBasedOnUserType(userType: UserType, router: Router) {
  switch (userType) {
    case UserType.CLIENT:
      router.navigate(['/']);
      break;
    case UserType.ADMIN:
    case UserType.DELIVERY:
      router.navigate(['/clients']);
      break;
    default:
      router.navigate(['/']);
      break;
  }
}

function navigateBasedOnUserTypeIfNeeded(userType: UserType, currentPath: string, router: Router) {
  // Only navigate if the current path doesn't match the user's expected path
  switch (userType) {
    case UserType.CLIENT:
      if (currentPath !== '/' && currentPath !== '') {
        router.navigate(['/']);
      }
      break;
    case UserType.ADMIN:
    case UserType.DELIVERY:
      if (currentPath !== '/clients' && currentPath !== '/' && currentPath !== '') {
        router.navigate(['/clients']);
      }
      break;
  }
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, router = inject(Router)) => ({
    _loginSuccess(response: AuthResponse) {
      // Persist refresh token and user; keep access token in store
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      sessionStorage.setItem('access_token', response.access_token);
      patchState(store, { user: response.user, accessToken: response.access_token, isAuthenticated: true, loading: false, error: null });
      // Navigate based on user type after successful login
      console.log('Login successful, navigating based on user type...');
      navigateBasedOnUserType(response.user.userType, router);
    }
  })),
  withMethods((store) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return {
      login(credentials: LoginRequest) {
        patchState(store, { loading: true, error: null });

        authService.login(credentials).subscribe({
          next: (response) => {
            store._loginSuccess(response);
          },
          error: (error) => {
            patchState(store, {
              loading: false,
              error: error.error?.message || 'Login failed',
            });
          },
        });
      },

      register(userData: RegisterRequest) {
        patchState(store, { loading: true, error: null });

        authService.register(userData).subscribe({
          next: (response) => {
            store._loginSuccess(response);
          },
          error: (error) => {
            patchState(store, {
              loading: false,
              error: error.error?.message || 'Registration failed',
            });
          },
        });
      },

      logout() {
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
        sessionStorage.removeItem('access_token');
        patchState(store, {
          user: null,
          accessToken: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
        router.navigate(['/login']);
      },

      clearError() {
        patchState(store, { error: null });
      },

      async initializeAuth() {
        // No upfront API call. Trust what's present; interceptor will refresh on 401/403.
        const userStr = localStorage.getItem('auth_user');
        const existingUser: User | null = userStr ? JSON.parse(userStr) : null;
        // Restore access token for interceptor use
        const token = sessionStorage.getItem('access_token');
        if (token) sessionStorage.setItem('access_token', token);
        patchState(store, { user: existingUser, isAuthenticated: !!token, loading: false });

        // Navigate based on user type if authenticated
        if (existingUser && token) {
          const currentPath = router.url;
          navigateBasedOnUserTypeIfNeeded(existingUser.userType, currentPath, router);
        }
      },

      getAccessToken(): string | null {
        return store.accessToken();
      },

      refreshUsingStoredToken(): Observable<string> {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          return throwError(() => new Error('No refresh token available'));
        }

        return authService.refresh(refreshToken).pipe(
          switchMap((newToken) => {
            if (!newToken?.access_token || !newToken?.refresh_token) {
              this.logout();
              return throwError(() => new Error('Invalid refresh token response'));
            }

            store._loginSuccess(newToken);
            return of(newToken.access_token);
          }),
          catchError((err) => {
            this.logout();
            return throwError(() => err);
          })
        )
      },
    };
  }),
  withHooks({
    onInit(store) {
      store.initializeAuth();
    },
  })
);
