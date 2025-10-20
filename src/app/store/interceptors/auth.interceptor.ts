import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TOKEN_REFRESH_URL } from '../api/auth-api.service';
import { AuthStore } from '../features';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);

  const token = sessionStorage.getItem('access_token');
  const authReq = token ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        if (req.url === TOKEN_REFRESH_URL) {
          authStore.logout();
          return throwError(() => error);
        }

        return authStore.refreshUsingStoredToken().pipe(
          switchMap((newToken) => {
            const retryReq = req.clone({ headers: req.headers.set('Authorization', `Bearer ${newToken}`) });
            return next(retryReq);
          }),
        );
      }
      return throwError(() => error);
    })
  );
};
