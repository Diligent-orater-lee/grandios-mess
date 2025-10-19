import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MealType, PatternDefinition, PatternKind } from '../../store/models';

@Component({
  selector: 'app-pattern-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './pattern-list.component.html',
  styleUrl: './pattern-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternListComponent {
  // Inputs
  readonly patterns = input<PatternDefinition[]>([]);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);

  // Outputs
  readonly edit = output<PatternDefinition>();
  readonly delete = output<string>();
  readonly createNew = output<void>();

  // Computed signals
  protected readonly hasPatterns = computed(() => this.patterns().length > 0);
  protected readonly activePatterns = computed(() =>
    this.patterns().filter(p => p.active)
  );
  protected readonly inactivePatterns = computed(() =>
    this.patterns().filter(p => !p.active)
  );

  // Helper methods
  protected getPatternKindLabel(kind: PatternKind): string {
    const labels: Record<PatternKind, string> = {
      [PatternKind.Daily]: 'Daily',
      [PatternKind.Weekdays]: 'Weekdays',
      [PatternKind.Weekends]: 'Weekends',
      [PatternKind.SpecificWeekdays]: 'Specific Days',
    };
    return labels[kind];
  }

  protected getMealTypeLabel(meal: MealType): string {
    const labels: Record<MealType, string> = {
      [MealType.Breakfast]: 'Breakfast',
      [MealType.Lunch]: 'Lunch',
      [MealType.Dinner]: 'Dinner',
    };
    return labels[meal];
  }

  protected getWeekdayLabels(isoWeekdays: number[]): string[] {
    const weekdayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return isoWeekdays.map(day => weekdayNames[day]).filter(Boolean);
  }

  protected getPatternDescription(pattern: PatternDefinition): string {
    const { kind, meals, isoWeekdays } = pattern.rule;
    const mealLabels = meals.map(meal => this.getMealTypeLabel(meal)).join(', ');

    switch (kind) {
      case PatternKind.Daily:
        return `Every day: ${mealLabels}`;
      case PatternKind.Weekdays:
        return `Monday-Friday: ${mealLabels}`;
      case PatternKind.Weekends:
        return `Saturday-Sunday: ${mealLabels}`;
      case PatternKind.SpecificWeekdays:
        const dayLabels = this.getWeekdayLabels(isoWeekdays || []).join(', ');
        return `${dayLabels}: ${mealLabels}`;
      default:
        return mealLabels;
    }
  }

  protected getDateRangeText(pattern: PatternDefinition): string {
    const { startDateISO, endDateISO } = pattern;
    const startDate = startDateISO ? new Date(startDateISO).toLocaleDateString() : 'Unknown';

    if (endDateISO) {
      const endDate = new Date(endDateISO).toLocaleDateString();
      return `${startDate} - ${endDate}`;
    }

    return `From ${startDate}`;
  }

  protected onEdit(pattern: PatternDefinition): void {
    this.edit.emit(pattern);
  }

  protected onDelete(patternId: string): void {
    this.delete.emit(patternId);
  }

  protected onCreateNew(): void {
    this.createNew.emit();
  }
}
