import { inject } from '@angular/core';
import { withHooks, signalStore, withState, patchState, withMethods } from '@ngrx/signals';
import { CalendarApiService } from '../api/calendar-api.service';
import { ApiResponse, CalendarMonth, CalendarQuery, CalendarWeek, DaySchedule, MealType, ToggleMealRequest, WeekStart } from '../models';

interface CalendarState {
  view: 'month' | 'week';
  monthData: CalendarMonth | undefined;
  weekData: CalendarWeek | undefined;
  loading: boolean;
  weekStartsOn: WeekStart;
  currentMonth: { year: number; month: number };
  currentWeekStartISO: string | undefined;
}

const today = new Date();

const initialState: CalendarState = {
  view: 'month',
  loading: false,
  weekStartsOn: 0,
  currentMonth: { year: today.getFullYear(), month: today.getMonth() },
  monthData: undefined,
  weekData: undefined,
  currentWeekStartISO: undefined,
};

export const CalendarStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const api = inject(CalendarApiService);
    return {
      setView(view: 'month' | 'week') {
        patchState(store, { view });
        if (view === 'month') this.loadMonth();
        if (view === 'week') this.loadWeek();
      },
      setMonth(year: number, month: number) {
        patchState(store, { currentMonth: { year, month } });
        if (store.view() === 'month') this.loadMonth();
      },
      setWeekStartISO(startISO: string) {
        patchState(store, { currentWeekStartISO: startISO });
        if (store.view() === 'week') this.loadWeek();
      },
      setWeekStartsOn(weekStartsOn: WeekStart) {
        patchState(store, { weekStartsOn });
        if (store.view() === 'month') this.loadMonth();
      },
      loadMonth() {
        const currentMonth = store.currentMonth();
        const weekStartsOn = store.weekStartsOn();
        patchState(store, { loading: true });
        const query: CalendarQuery = { year: currentMonth.year, month: currentMonth.month, weekStartsOn };
        api.getMonth(query).subscribe((res) => {
          patchState(store, { monthData: res.data, loading: false });
        });
      },
      loadWeek() {
        const startISO = store.currentWeekStartISO?.() ?? new Date().toISOString().slice(0, 10);
        patchState(store, { loading: true, currentWeekStartISO: startISO });
        api.getWeek(startISO).subscribe((res) => {
          patchState(store, { weekData: res.data, loading: false });
        });
      },
      toggleMeal(dateISO: string, meal: MealType, optedIn: boolean) {
        patchState(store, { loading: true });
        const req: ToggleMealRequest = { dateISO, meal, optedIn };
        api.toggleMeal(req).subscribe(() => {
          if (store.view() === 'month') this.loadMonth();
          else this.loadWeek();
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      store.loadMonth();
    },
  })
);


