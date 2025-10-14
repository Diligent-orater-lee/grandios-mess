// Domain models for the Hostel Mess subscription scheduling app
// These models are intentionally backend-friendly: keep them close to what a real API would expose.

export enum MealType {
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Dinner = 'dinner',
}

export interface MealOptIn {
  meal: MealType;
  optedIn: boolean; // true if the user wants this meal delivered on the given date
  // Whether this meal can be edited (e.g., future not yet served)
  isEditable?: boolean;
  // Whether this meal has already been served (past or earlier today beyond meal time)
  isServed?: boolean;
}

export interface DaySchedule {
  // ISO date string for the day (e.g., 2025-10-14)
  dateISO: string;
  meals: MealOptIn[]; // order: breakfast, lunch, dinner (API must not assume order)
  // If this day differs from any applicable pattern, API should mark it as an exception.
  isException?: boolean;
  // Whether this date belongs to the currently requested month (for grid placeholders)
  inCurrentMonth?: boolean;
}

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, ...

export interface CalendarQuery {
  month: number; // 0-11
  year: number; // four-digit year
  weekStartsOn: WeekStart; // first day of week for UI grouping
}

export interface CalendarMonth {
  month: number; // 0-11
  year: number;
  days: DaySchedule[]; // contiguous calendar grid days covering the month view
}

export interface CalendarWeek {
  startDateISO: string; // first day in the displayed week
  days: DaySchedule[]; // 7 entries
}

export enum PatternKind {
  // Weekdays (Mon-Fri)
  Weekdays = 'weekdays',
  // Weekends (Sat-Sun)
  Weekends = 'weekends',
  // Every day
  Daily = 'daily',
  // Specific weekdays selection (e.g., Mon, Wed, Fri)
  SpecificWeekdays = 'specific_weekdays',
}

export interface RecurrenceRule {
  kind: PatternKind;
  // For SpecificWeekdays, this is required; 1=Mon..7=Sun for ISO, or 0..6 also acceptable, but we will use 1..7 ISO here.
  isoWeekdays?: number[]; // [1..7]
  meals: MealType[]; // which meals are opted-in when the rule applies
}

export interface PatternDefinition {
  id: string; // stable id provided by backend
  name: string;
  active: boolean; // inactive patterns should not apply
  rule: RecurrenceRule;
  // Optional start/end bounds; if omitted, applies indefinitely
  startDateISO?: string;
  endDateISO?: string;
}

export interface ApplyPatternRequest {
  patternId: string;
  // Optional range to (re)apply the rule and compute day schedules
  fromDateISO?: string;
  toDateISO?: string;
}

export interface ToggleMealRequest {
  dateISO: string;
  meal: MealType;
  optedIn: boolean;
}

export interface ApiResponse<T> {
  data: T;
}



