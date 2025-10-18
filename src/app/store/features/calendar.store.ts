import { inject, Injector, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { combineLatest, distinctUntilChanged, filter, map, pipe, switchMap } from 'rxjs';
import { CalendarApiService } from '../api/calendar-api.service';
import { CalendarMonth, CalendarQuery, CalendarWeek, MealType, ToggleMealRequest, WeekStart } from '../models';

interface CalendarState {
  view: 'month' | 'week';
  monthData: CalendarMonth | undefined;
  weekData: CalendarWeek | undefined;
  loading: boolean;
  weekStartsOn: WeekStart;
  currentMonth: { year: number; month: number };
  currentWeekStartISO: string | undefined;
  selectedUserId: string | undefined;
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
  selectedUserId: undefined,
};

export const CalendarStore = signalStore(
  withState(initialState),
  withMethods((store) => {
    const api = inject(CalendarApiService);
    return {
      setView(view: 'month' | 'week') {
        patchState(store, { view });
      },
      setMonth(year: number, month: number) {
        patchState(store, { currentMonth: { year, month } });
      },
      setWeekStartISO(startISO: string) {
        patchState(store, { currentWeekStartISO: startISO });
      },
      setWeekStartsOn(weekStartsOn: WeekStart) {
        patchState(store, { weekStartsOn });
      },
      setSelectedUserId: rxMethod<string | undefined>(
        map((userId) => {
          patchState(store, { selectedUserId: userId });
        })
      ),
      loadMonth() {
        const currentMonth = store.currentMonth();
        const weekStartsOn = store.weekStartsOn();
        const selectedUserId = store.selectedUserId();
        patchState(store, { loading: true });
        const query: CalendarQuery = { year: currentMonth.year, month: currentMonth.month, weekStartsOn, userId: selectedUserId };
        api.getMonth(query).subscribe({
          next: (res) => {
            patchState(store, { monthData: res.data, loading: false });
          },
          error: (error) => {
            patchState(store, { loading: false });
            console.error('Error loading month:', error);
          }
        });
      },
      loadWeek() {
        const startISO = store.currentWeekStartISO?.() ?? new Date().toISOString().slice(0, 10);
        const selectedUserId = store.selectedUserId();
        patchState(store, { loading: true, currentWeekStartISO: startISO });
        api.getWeek(startISO, selectedUserId).subscribe({
          next: (res) => {
            patchState(store, { weekData: res.data, loading: false });
          },
          error: (error) => {
            patchState(store, { loading: false });
            console.error('Error loading week:', error);
          }
        });
      },
      toggleMeal(dateISO: string, meal: MealType, optedIn: boolean) {
        patchState(store, { loading: true });
        const req: ToggleMealRequest = { dateISO, meal, optedIn };
        api.toggleMeal(req).subscribe({
          next: () => {
            if (store.view() === 'month') this.loadMonth();
            else this.loadWeek();
          },
          error: (error) => {
            patchState(store, { loading: false });
            console.error('Error toggling meal:', error);
          }
        });
      },
    };
  }),
  withMethods((store, injector = inject(Injector)) => {
    function obserbleOf<T>(value: Signal<T>) {
      return toObservable(value, {injector}).pipe(distinctUntilChanged());
    }

    return {
      autoLoadMonth: rxMethod<void>(
        pipe(
          switchMap(() => {
            return combineLatest([
              obserbleOf(store.view),
              obserbleOf(store.currentMonth),
              obserbleOf(store.currentWeekStartISO),
              obserbleOf(store.selectedUserId),
            ])
          }),
          filter(() => store.view() === 'month'),
          map(() => store.loadMonth())
        )
      ),
      autoLoadWeek: rxMethod<void>(
        pipe(
          switchMap(() => {
            return combineLatest([
              obserbleOf(store.view),
              obserbleOf(store.currentWeekStartISO),
              obserbleOf(store.selectedUserId)
            ])
          }),
          filter(() => store.view() === 'week'),
          map(() => store.loadWeek())
        )
      ),
    };
  }),
  withHooks({
    onInit(store) {
      store.autoLoadMonth();
      store.autoLoadWeek();
    },
  })
);


