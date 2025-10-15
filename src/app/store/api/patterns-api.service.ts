import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PatternDefinition, CreatePatternRequest } from '../models';
import { environment } from '../../../environments/environment';

/**
 * PatternsApiService integrates with the real backend API for pattern CRUD operations.
 */
@Injectable({ providedIn: 'root' })
export class PatternsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  public list(): Observable<ApiResponse<PatternDefinition[]>> {
    return this.http.get<ApiResponse<PatternDefinition[]>>(`${this.apiUrl}/patterns`);
  }

  public create(input: CreatePatternRequest): Observable<ApiResponse<PatternDefinition>> {
    return this.http.post<ApiResponse<PatternDefinition>>(`${this.apiUrl}/patterns`, input);
  }

  public update(id: string, changes: Partial<PatternDefinition>): Observable<ApiResponse<PatternDefinition>> {
    return this.http.patch<ApiResponse<PatternDefinition>>(`${this.apiUrl}/patterns/${id}`, changes);
  }

  public delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/patterns/${id}`);
  }
}



