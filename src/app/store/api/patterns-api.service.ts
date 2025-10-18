import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CreatePatternDto, PatternDefinition, UpdatePatternDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PatternsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Create a new pattern
   */
  createPattern(pattern: CreatePatternDto): Observable<ApiResponse<PatternDefinition>> {
    return this.http.post<ApiResponse<PatternDefinition>>(`${this.apiUrl}/patterns`, pattern);
  }

  /**
   * Get all patterns for the current user or a specific user (admin only)
   */
  getPatterns(userId?: string): Observable<ApiResponse<PatternDefinition[]>> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('userId', userId);
    }
    return this.http.get<ApiResponse<PatternDefinition[]>>(`${this.apiUrl}/patterns`, { params });
  }

  /**
   * Get a single pattern by ID
   */
  getPattern(id: string, userId?: string): Observable<ApiResponse<PatternDefinition>> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('userId', userId);
    }
    return this.http.get<ApiResponse<PatternDefinition>>(`${this.apiUrl}/patterns/${id}`, { params });
  }

  /**
   * Update an existing pattern
   */
  updatePattern(id: string, updates: UpdatePatternDto, userId?: string): Observable<ApiResponse<PatternDefinition>> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('userId', userId);
    }
    return this.http.patch<ApiResponse<PatternDefinition>>(`${this.apiUrl}/patterns/${id}`, updates, { params });
  }

  /**
   * Delete a pattern
   */
  deletePattern(id: string, userId?: string): Observable<void> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('userId', userId);
    }
    return this.http.delete<void>(`${this.apiUrl}/patterns/${id}`, { params });
  }
}