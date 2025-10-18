import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { PaginatedResponse, UserListItem, PaginationParams } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  constructor() {}

  /**
   * Get delivery users (Admin only)
   */
  getDeliveryUsers(params: PaginationParams = {}): Observable<PaginatedResponse<UserListItem>> {
    const httpParams = this.buildHttpParams(params);
    
    return this.http.get<PaginatedResponse<UserListItem>>(`${this.apiUrl}/users/delivery`, { params: httpParams })
      .pipe(
        catchError(error => {
          console.error('Get delivery users error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get client users (Admin and Delivery users)
   */
  getClientUsers(params: PaginationParams = {}): Observable<PaginatedResponse<UserListItem>> {
    const httpParams = this.buildHttpParams(params);
    
    return this.http.get<PaginatedResponse<UserListItem>>(`${this.apiUrl}/users/clients`, { params: httpParams })
      .pipe(
        catchError(error => {
          console.error('Get client users error:', error);
          return throwError(() => error);
        })
      );
  }

  private buildHttpParams(params: PaginationParams): HttpParams {
    let httpParams = new HttpParams();
    
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    
    return httpParams;
  }
}
