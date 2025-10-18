import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, CalendarMonth, CalendarQuery, CalendarWeek, DaySchedule, MealType, ToggleMealRequest } from '../models';
import { environment } from '../../../environments/environment';

/**
 * CalendarApiService integrates with the real backend API for calendar operations.
 * The backend handles pattern application and day schedule resolution.
 */
@Injectable({ providedIn: 'root' })
export class CalendarApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  public getMonth(query: CalendarQuery): Observable<ApiResponse<CalendarMonth>> {
    const requestBody: any = {
      year: query.year,
      month: query.month,
      weekStartsOn: query.weekStartsOn,
    };
    
    // Include userId if provided (for admin access)
    if (query.userId) {
      requestBody.userId = query.userId;
    }
    
    return this.http.post<ApiResponse<CalendarMonth>>(`${this.apiUrl}/calendar/month`, requestBody);
  }

  public getWeek(startDateISO: string, userId?: string): Observable<ApiResponse<CalendarWeek>> {
    const params: any = { startDateISO };
    if (userId) {
      params.userId = userId;
    }
    return this.http.get<ApiResponse<CalendarWeek>>(`${this.apiUrl}/calendar/week`, { params });
  }

  public toggleMeal(req: ToggleMealRequest): Observable<ApiResponse<DaySchedule>> {
    return this.http.post<ApiResponse<DaySchedule>>(`${this.apiUrl}/calendar/toggle`, req);
  }
}

