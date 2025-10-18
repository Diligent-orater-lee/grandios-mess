import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService, TOKEN_REFRESH_URL } from '../api/auth-api.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const token = sessionStorage.getItem('access_token');
  const authReq = token ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        const hasRefresh = !!localStorage.getItem('refresh_token');
        if (!hasRefresh || req.url === TOKEN_REFRESH_URL) {
          // Clear storages to force re-auth on next navigation
          sessionStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth_user');
          return throwError(() => error);
        }

        return from(authService.refresh(localStorage.getItem('refresh_token') as string)).pipe(
          switchMap((newToken) => {
            if (!newToken?.access_token || !newToken?.refresh_token) {
              sessionStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('auth_user');
              return throwError(() => error);
            }
            // Rotate tokens in storage
            sessionStorage.setItem('access_token', newToken.access_token);
            localStorage.setItem('refresh_token', newToken.refresh_token);
            if (newToken.user) {
              localStorage.setItem('auth_user', JSON.stringify(newToken.user));
            }
            const retryReq = req.clone({ headers: req.headers.set('Authorization', `Bearer ${newToken.access_token}`) });
            return next(retryReq);
          }),
          catchError((refreshErr) => {
            sessionStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('auth_user');
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
