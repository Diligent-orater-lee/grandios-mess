import { CommonModule } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router } from '@angular/router';
import { delay, filter, fromEvent, map, startWith, switchMap } from 'rxjs';
import { AuthStore } from '../../store/features/auth.store';
import { CalendarStore } from '../../store/features/calendar.store';
import { MealType, UserType } from '../../store/models';
import { DayCellComponent } from '../day-cell/day-cell.component';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatToolbarModule,
    DayCellComponent,
  ],
  providers: [
    CalendarStore
  ],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPageComponent {
  private readonly store = inject(CalendarStore);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  protected readonly MealType = MealType;

  protected readonly calendarGridRef = viewChild<ElementRef<HTMLElement>>('calendarGrid');

  protected readonly todayISO = signal(new Date().toISOString().slice(0, 10));

  constructor() {
    this.store.setSelectedUserId(
      this.route.paramMap.pipe(map(params => params.get('userId') || undefined))
    );

    toObservable(this.calendarGridRef).pipe(
      filter(Boolean),
      filter(() => this.view() === "month"),
      switchMap(() => fromEvent(window, 'resize').pipe(startWith(null), map(() => window.innerWidth <= 960))),
      filter(Boolean),
      delay(20),
      takeUntilDestroyed()
    ).subscribe(() => {
        afterNextRender(() => {
          this.scrollToToday();
        }, { injector: this.injector });
    });
  }

  protected view = computed(() => this.store.view());
  protected loading = computed(() => this.store.loading());
  protected month = computed(() => this.store.monthData?.());
  protected week = computed(() => this.store.weekData?.());
  protected selectedUserId = computed(() => this.store.selectedUserId());
  protected currentUser = computed(() => this.authStore.user());
  protected isAdminOrDelivery = computed(() => {
    const user = this.currentUser();
    return user?.userType === UserType.ADMIN || user?.userType === UserType.DELIVERY;
  });

  // UI helpers
  protected readonly mealLabel: Record<MealType, string> = {
    [MealType.Breakfast]: 'Breakfast',
    [MealType.Lunch]: 'Lunch',
    [MealType.Dinner]: 'Dinner',
  } as const;

  protected readonly mealTime: Record<MealType, string> = {
    [MealType.Breakfast]: '08:00',
    [MealType.Lunch]: '12:00',
    [MealType.Dinner]: '20:00',
  } as const;


  protected todayMeals = computed(() => {
    const m = this.month();
    const w = this.week();
    const source = m?.days ?? w?.days ?? [];
    const today = source.find(d => d.dateISO === this.todayISO());
    return today?.meals ?? [];
  });

  protected weekdayNames = computed(() => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const start = this.store.weekStartsOn();
    const arr: string[] = [];
    for (let i = 0; i < 7; i++) arr.push(names[(start + i) % 7]);
    return arr;
  });

  protected monthLabel = computed(() => {
    const { month } = this.store.currentMonth();
    return new Date(new Date().getFullYear(), month, 1).toLocaleString(undefined, { month: 'long' });
  });

  protected toggleMeal(dateISO: string, meal: MealType, next: boolean): void {
    this.store.toggleMeal(dateISO, meal, next);
  }

  protected setView(view: 'month' | 'week'): void {
    this.store.setView(view);
  }

  protected prev(): void {
    if (this.store.view() === 'month') {
      const { month, year } = this.store.currentMonth();
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      this.store.setMonth(prevYear, prevMonth);
    } else {
      const startISO = this.store.currentWeekStartISO?.() ?? new Date().toISOString().slice(0, 10);
      const d = new Date(startISO);
      d.setDate(d.getDate() - 7);
      this.store.setWeekStartISO(d.toISOString().slice(0, 10));
    }
  }

  protected next(): void {
    if (this.store.view() === 'month') {
      const { month, year } = this.store.currentMonth();
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      this.store.setMonth(nextYear, nextMonth);
    } else {
      const startISO = this.store.currentWeekStartISO?.() ?? new Date().toISOString().slice(0, 10);
      const d = new Date(startISO);
      d.setDate(d.getDate() + 7);
      this.store.setWeekStartISO(d.toISOString().slice(0, 10));
    }
  }

  protected isInCurrentMonth(dateISO: string, displayMonth: number): boolean {
    return new Date(dateISO).getMonth() === displayMonth;
  }

  protected goBackToClients(): void {
    this.router.navigate(['/clients']);
  }


  private scrollToToday(): void {
    const calendarGrid = this.calendarGridRef();
    if (!calendarGrid?.nativeElement) return;

    const todayElement = calendarGrid.nativeElement.querySelector(`[data-date="${this.todayISO()}"]`);
    if (todayElement) {
      todayElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }
}


