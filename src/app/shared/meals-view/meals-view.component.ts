import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DaySchedule, MealType } from '../../store/models';

@Component({
  selector: 'app-meals-view',
  standalone: true,
  imports: [
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './meals-view.component.html',
  styleUrls: ['./meals-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MealsViewComponent {
  // Input signals
  public readonly daySchedule = input.required<DaySchedule>();

  // Computed signals
  protected readonly breakfast = computed(() => 
    this.daySchedule().meals.find(meal => meal.meal === MealType.Breakfast)
  );
  
  protected readonly lunch = computed(() => 
    this.daySchedule().meals.find(meal => meal.meal === MealType.Lunch)
  );
  
  protected readonly dinner = computed(() => 
    this.daySchedule().meals.find(meal => meal.meal === MealType.Dinner)
  );

  protected readonly meals = computed(() => [
    { meal: this.breakfast(), type: MealType.Breakfast, icon: 'free_breakfast', label: 'Breakfast' },
    { meal: this.lunch(), type: MealType.Lunch, icon: 'lunch_dining', label: 'Lunch' },
    { meal: this.dinner(), type: MealType.Dinner, icon: 'dinner_dining', label: 'Dinner' }
  ]);

  protected getMealIcon(meal: any): string {
    return meal?.optedIn ? 'check_circle' : 'cancel';
  }

  protected getMealColor(meal: any): string {
    return meal?.optedIn ? 'primary' : 'warn';
  }

  protected getTooltipText(meal: any, label: string): string {
    if (!meal) return `${label}: Not available`;
    return meal.optedIn ? `${label}: Opted in` : `${label}: Not opted in`;
  }
}
