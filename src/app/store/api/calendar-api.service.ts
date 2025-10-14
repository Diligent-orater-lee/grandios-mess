import { Injectable, inject } from '@angular/core';
import { defer, map, of, delay, Observable } from 'rxjs';
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, formatISO, isAfter, isBefore, isSameDay, startOfMonth, startOfWeek } from 'date-fns';
import { ApiResponse, CalendarMonth, CalendarQuery, CalendarWeek, DaySchedule, MealType, PatternDefinition, ToggleMealRequest } from '../models';
import { PatternsApiService } from './patterns-api.service';

/**
 * CalendarApiService simulates a backend that persists per-day meal opt-in data and
 * resolves month/week calendars by combining persisted day exceptions with active patterns.
 *
 * Integration guide for real backend:
 * - Replace in-memory `_dayOverrides` with DB-backed storage keyed by date and meal.
 * - Implement endpoints:
 *   - GET /calendar/month?year=YYYY&month=MM&weekStartsOn=X -> CalendarMonth
 *   - GET /calendar/week?startDate=YYYY-MM-DD -> CalendarWeek
 *   - POST /calendar/toggle { dateISO, meal, optedIn } -> DaySchedule
 * - Calendar responses should include `isException` for days that differ from the applied patterns.
 * - Patterns application logic should run server-side based on active patterns from Patterns API.
 */
@Injectable({ providedIn: 'root' })
export class CalendarApiService {
  // In-memory overrides representing per-day user decisions. Map of dateISO -> DaySchedule
  private readonly dayOverrides = new Map<string, DaySchedule>();

  // Simulate backend dependency on Patterns API. In real integration, backend resolves this itself.
  private readonly patternsApi = inject(PatternsApiService);

  public getMonth(query: CalendarQuery): Observable<ApiResponse<CalendarMonth>> {
    return defer(() => {
      const firstOfMonth = startOfMonth(new Date(query.year, query.month, 1));
      const lastOfMonth = endOfMonth(firstOfMonth);
      const gridStart = startOfWeek(firstOfMonth, { weekStartsOn: query.weekStartsOn });
      const gridEnd = endOfWeek(lastOfMonth, { weekStartsOn: query.weekStartsOn });
      const allGridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
      const days = allGridDays.map((d) => {
        const dateISO = formatISO(d, { representation: 'date' });
        const base = this.resolveDay(dateISO);
        const inCurrentMonth = d.getMonth() === query.month;
        return { ...base, inCurrentMonth };
      });

      const month: CalendarMonth = {
        month: query.month,
        year: query.year,
        days,
      };
      return of<ApiResponse<CalendarMonth>>({ data: month }).pipe(delay(150));
    });
  }

  public getWeek(startDateISO: string): Observable<ApiResponse<CalendarWeek>> {
    return defer(() => {
      const start = new Date(startDateISO);
      const days = Array.from({ length: 7 }).map((_, i) => {
        const dateISO = formatISO(addDays(start, i), { representation: 'date' });
        return this.resolveDay(dateISO);
      });
      return of<ApiResponse<CalendarWeek>>({ data: { startDateISO, days } }).pipe(delay(120));
    });
  }

  public toggleMeal(req: ToggleMealRequest): Observable<ApiResponse<DaySchedule>> {
    return defer(() => {
      const existing = this.resolveDay(req.dateISO);
      const updatedMeals = existing.meals.map((m) => (m.meal === req.meal ? { ...m, optedIn: req.optedIn } : m));
      const isException = this.computeIsException(req.dateISO, updatedMeals);
      const updated: DaySchedule = { dateISO: req.dateISO, meals: updatedMeals, isException };
      this.dayOverrides.set(req.dateISO, updated);
      return of<ApiResponse<DaySchedule>>({ data: updated }).pipe(delay(100));
    });
  }

  // Resolves the day schedule combining overrides (exceptions) and active patterns.
  private resolveDay(dateISO: string): DaySchedule {
    const override = this.dayOverrides.get(dateISO);
    if (override) {
      return override;
    }
    const meals = this.computeMealsFromPatterns(dateISO);
    const isException = false;
    return { dateISO, meals, isException };
  }

  private computeMealsFromPatterns(dateISO: string): DaySchedule['meals'] {
    const active = this.patternsApi.getActivePatternsSync();
    // Apply last-one-wins merge by meal across patterns in creation order
    const byMeal = new Map<MealType, boolean>();
    for (const pattern of active) {
      if (this.patternAppliesOnDate(pattern, dateISO)) {
        for (const meal of [MealType.Breakfast, MealType.Lunch, MealType.Dinner]) {
          byMeal.set(meal, pattern.rule.meals.includes(meal));
        }
      }
    }
    // default optedIn=false if no pattern set it
    const now = new Date();
    const date = new Date(dateISO);
    const parts: { meal: MealType; hour: number }[] = [
      { meal: MealType.Breakfast, hour: 8 },
      { meal: MealType.Lunch, hour: 12 },
      { meal: MealType.Dinner, hour: 20 },
    ];
    return parts.map(({ meal, hour }) => {
      const mealTime = new Date(date);
      mealTime.setHours(hour, 0, 0, 0);
      const served = now > mealTime;
      const editable = !served; // simple rule: not editable if already served
      return {
        meal,
        optedIn: byMeal.get(meal) ?? false,
        isEditable: editable,
        isServed: served,
      };
    });
  }

  private patternAppliesOnDate(pattern: PatternDefinition, dateISO: string): boolean {
    if (!pattern.active) return false;
    const date = new Date(dateISO);
    if (pattern.startDateISO && isBefore(date, new Date(pattern.startDateISO))) return false;
    if (pattern.endDateISO && isAfter(date, new Date(pattern.endDateISO))) return false;
    const weekdayISO: number = ((date.getDay() + 6) % 7) + 1; // 1..7 (Mon..Sun)
    switch (pattern.rule.kind) {
      case 'daily':
        return true;
      case 'weekdays':
        return weekdayISO >= 1 && weekdayISO <= 5;
      case 'weekends':
        return weekdayISO === 6 || weekdayISO === 7;
      case 'specific_weekdays':
        return !!pattern.rule.isoWeekdays?.includes(weekdayISO);
      default:
        return false;
    }
  }

  private computeIsException(dateISO: string, meals: DaySchedule['meals']): boolean {
    const patternMeals = this.computeMealsFromPatterns(dateISO);
    return meals.some((m) => patternMeals.find((pm) => pm.meal === m.meal)?.optedIn !== m.optedIn);
  }
}



