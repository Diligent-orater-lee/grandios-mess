import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DaySchedule, MealType } from '../../store/models';

@Component({
  selector: 'app-day-cell',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, MatIconModule],
  templateUrl: './day-cell.component.html',
  styleUrl: './day-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayCellComponent {
  @Input({ required: true }) day!: DaySchedule;
  @Input({ required: true }) mealLabel!: Record<MealType, string>;
  @Input({ required: true }) mealTime!: Record<MealType, string>;
  @Input({ required: true }) inCurrentMonth!: boolean;

  @Output() toggle = new EventEmitter<{ dateISO: string; meal: MealType; optedIn: boolean }>();

  protected readonly isToday = computed(() => new Date(this.day.dateISO).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0));

  protected onToggle(meal: MealType, checked: boolean): void {
    this.toggle.emit({ dateISO: this.day.dateISO, meal, optedIn: checked });
  }

  protected get allServed(): boolean {
    return Array.isArray(this.day?.meals) && this.day.meals.every((m) => !!m.isServed);
  }

  protected get dayName(): string {
    const d = new Date(this.day.dateISO);
    return d.toLocaleString(undefined, { weekday: 'short' });
  }
}



