import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { AuthService } from '../api/auth-api.service';
import { AuthState, LoginRequest, RegisterRequest, User } from '../models';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return {
      login(credentials: LoginRequest) {
        patchState(store, { loading: true, error: null });
        
        authService.login(credentials).subscribe({
          next: (response) => {
            patchState(store, {
              user: response.user,
              token: response.access_token,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
            // Navigate to calendar page after successful login
            console.log('Login successful, navigating to calendar...');
            router.navigate(['/']);
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
            patchState(store, {
              user: response.user,
              token: response.access_token,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
            // Navigate to calendar page after successful registration
            console.log('Registration successful, navigating to calendar...');
            router.navigate(['/']);
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
        authService.logout();
        patchState(store, {
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
      },

      clearError() {
        patchState(store, { error: null });
      },

      initializeAuth() {
        const user = authService.getUser();
        const token = authService.getToken();
        const isAuthenticated = authService.isAuthenticated();

        patchState(store, {
          user,
          token,
          isAuthenticated,
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      store.initializeAuth();
    },
  })
);
