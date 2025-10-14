import { Injectable } from '@angular/core';
import { defer, map, of, delay, Observable } from 'rxjs';
import { addDays, formatISO } from 'date-fns';
import { ApiResponse, MealType, PatternDefinition, PatternKind, RecurrenceRule } from '../models';

/**
 * PatternsApiService simulates backend CRUD for recurrence patterns.
 *
 * Integration guide for real backend:
 * - Replace in-memory `_patterns` with DB-backed storage.
 * - Implement endpoints:
 *   - GET /patterns -> PatternDefinition[]
 *   - POST /patterns -> PatternDefinition
 *   - PATCH /patterns/:id -> PatternDefinition
 *   - DELETE /patterns/:id -> void
 * - Backend is responsible for applying patterns to the calendar when resolving month/week data.
 */
@Injectable({ providedIn: 'root' })
export class PatternsApiService {
  // In-memory storage to simulate backend. Newest pattern appended at end.
  private patterns: PatternDefinition[] = [
    {
      id: 'p_daily_lunch_dinner',
      name: 'Daily Lunch & Dinner',
      active: true,
      rule: { kind: PatternKind.Daily, meals: [MealType.Lunch, MealType.Dinner] },
    },
    {
      id: 'p_weekdays_breakfast',
      name: 'Weekdays Breakfast',
      active: true,
      rule: { kind: PatternKind.Weekdays, meals: [MealType.Breakfast] },
    },
  ];

  public list(): Observable<ApiResponse<PatternDefinition[]>> {
    return defer(() => of<ApiResponse<PatternDefinition[]>>({ data: [...this.patterns] }).pipe(delay(120)));
  }

  public create(input: Omit<PatternDefinition, 'id'>): Observable<ApiResponse<PatternDefinition>> {
    return defer(() => {
      const created: PatternDefinition = { ...input, id: 'p_' + Math.random().toString(36).slice(2) };
      this.patterns = [...this.patterns, created];
      return of<ApiResponse<PatternDefinition>>({ data: created }).pipe(delay(120));
    });
  }

  public update(id: string, changes: Partial<PatternDefinition>): Observable<ApiResponse<PatternDefinition>> {
    return defer(() => {
      this.patterns = this.patterns.map((p) => (p.id === id ? { ...p, ...changes } : p));
      const updated = this.patterns.find((p) => p.id === id)!;
      return of<ApiResponse<PatternDefinition>>({ data: updated }).pipe(delay(120));
    });
  }

  public delete(id: string): Observable<ApiResponse<void>> {
    return defer(() => {
      this.patterns = this.patterns.filter((p) => p.id !== id);
      return of<ApiResponse<void>>({ data: undefined }).pipe(delay(120));
    });
  }

  // Utility used by CalendarApiService to emulate "backend-side" pattern application logic.
  public getActivePatternsSync(): PatternDefinition[] {
    return this.patterns.filter((p) => p.active);
  }
}



