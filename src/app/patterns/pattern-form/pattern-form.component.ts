import { ChangeDetectionStrategy, Component, computed, inject, signal, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { CreatePatternDto, MealType, PatternDefinition, PatternKind } from '../../store/models';
import { PatternsStore } from '../../store/features/patterns.store';

@Component({
  selector: 'app-pattern-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatStepperModule,
    MatIconModule,
    MatCardModule,
    MatNativeDateModule,
    MatToolbarModule,
    MatSnackBarModule,
  ],
  providers: [PatternsStore],
  templateUrl: './pattern-form.component.html',
  styleUrl: './pattern-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly patternsStore = inject(PatternsStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // Computed signals from store
  protected readonly pattern = computed(() => this.patternsStore.currentPattern());
  protected readonly loading = computed(() => this.patternsStore.loading());
  protected readonly error = computed(() => this.patternsStore.error());
  protected readonly isEditMode = computed(() => !!this.pattern());
  
  // Form created from computed
  protected readonly form = computed(() => {
    const currentPattern = this.pattern();
    return this.fb.group({
      name: [currentPattern?.name || '', [Validators.required, Validators.minLength(3)]],
      active: [currentPattern?.active ?? true],
      kind: [currentPattern?.rule?.kind || PatternKind.Daily, Validators.required],
      isoWeekdays: [currentPattern?.rule?.isoWeekdays || []],
      meals: [currentPattern?.rule?.meals || [], [Validators.required, Validators.minLength(1)]],
      startDateISO: [currentPattern?.startDateISO ? new Date(currentPattern.startDateISO) : '', Validators.required],
      endDateISO: [currentPattern?.endDateISO ? new Date(currentPattern.endDateISO) : ''],
    });
  });

  // Pattern kinds
  protected readonly patternKinds = [
    { value: PatternKind.Daily, label: 'Daily', description: 'Every day' },
    { value: PatternKind.Weekdays, label: 'Weekdays', description: 'Monday to Friday' },
    { value: PatternKind.Weekends, label: 'Weekends', description: 'Saturday and Sunday' },
    { value: PatternKind.SpecificWeekdays, label: 'Specific Days', description: 'Choose specific days' },
  ];

  // Meal types
  protected readonly mealTypes = [
    { value: MealType.Breakfast, label: 'Breakfast' },
    { value: MealType.Lunch, label: 'Lunch' },
    { value: MealType.Dinner, label: 'Dinner' },
  ];

  // Weekday options
  protected readonly weekdays = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
  ];

  // Computed signals
  protected readonly selectedKind = signal<PatternKind>(PatternKind.Daily);
  protected readonly requiresSpecificDays = computed(() => 
    this.selectedKind() === PatternKind.SpecificWeekdays
  );

  constructor() {
    // Load pattern based on route params
    this.patternsStore.loadPatternFromRoute(this.route.paramMap);

    // Watch for kind changes using proper reactive pattern
    toObservable(this.form)
      .pipe(
        switchMap(form => form.get('kind')?.valueChanges || []),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(kind => {
        if (kind) {
          this.selectedKind.set(kind);
          const currentForm = this.form();
          if (kind !== PatternKind.SpecificWeekdays) {
            currentForm.get('isoWeekdays')?.setValue([]);
          }
        }
      });
  }

  protected onSave(): void {
    const form = this.form();
    if (form.valid) {
      const formValue = form.value;
      
      // Convert Date objects to ISO strings
      const startDateISO = formValue.startDateISO instanceof Date 
        ? formValue.startDateISO.toISOString() 
        : formValue.startDateISO;
      const endDateISO = formValue.endDateISO instanceof Date 
        ? formValue.endDateISO.toISOString() 
        : formValue.endDateISO;
      
      const patternData: CreatePatternDto = {
        name: formValue.name || '',
        active: formValue.active ?? true,
        kind: formValue.kind || PatternKind.Daily,
        isoWeekdays: formValue.kind === PatternKind.SpecificWeekdays ? (formValue.isoWeekdays || []) : undefined,
        meals: formValue.meals || [],
        startDateISO: startDateISO || '',
        endDateISO: endDateISO || undefined,
      };
      
      if (this.isEditMode()) {
        // Update existing pattern
        this.patternsStore.updatePattern({
          id: this.pattern()!.id,
          updates: patternData
        });
      } else {
        // Create new pattern
        this.patternsStore.createPattern(patternData);
      }
      
      this.showSuccessMessage(
        this.isEditMode() ? 'Pattern updated successfully' : 'Pattern created successfully'
      );
      this.router.navigate(['/patterns']);
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/patterns']);
  }

  protected onMealToggle(meal: MealType, checked: boolean): void {
    const form = this.form();
    const currentMeals = form.get('meals')?.value || [];
    if (checked) {
      form.get('meals')?.setValue([...currentMeals, meal]);
    } else {
      form.get('meals')?.setValue(currentMeals.filter((m: MealType) => m !== meal));
    }
  }

  protected onWeekdayToggle(weekday: number, checked: boolean): void {
    const form = this.form();
    const currentWeekdays = form.get('isoWeekdays')?.value || [];
    if (checked) {
      form.get('isoWeekdays')?.setValue([...currentWeekdays, weekday]);
    } else {
      form.get('isoWeekdays')?.setValue(currentWeekdays.filter((w: number) => w !== weekday));
    }
  }

  protected isMealSelected(meal: MealType): boolean {
    const selectedMeals = this.form().get('meals')?.value || [];
    return selectedMeals.includes(meal);
  }

  protected isWeekdaySelected(weekday: number): boolean {
    const selectedWeekdays = this.form().get('isoWeekdays')?.value || [];
    return selectedWeekdays.includes(weekday);
  }

  // Computed properties for template
  protected readonly selectedKindLabel = computed(() => {
    const kind = this.form().get('kind')?.value;
    return this.patternKinds.find(k => k.value === kind)?.label || 'Not specified';
  });

  protected readonly selectedMealsText = computed(() => {
    const meals = this.form().get('meals')?.value || [];
    return meals.join(', ') || 'None selected';
  });

  protected readonly selectedWeekdaysText = computed(() => {
    const weekdays = this.form().get('isoWeekdays')?.value || [];
    return weekdays.map((d: number) => this.weekdays.find(w => w.value === d)?.label).join(', ') || 'None selected';
  });

  protected readonly startDateText = computed(() => {
    return this.form().get('startDateISO')?.value || 'Not specified';
  });

  protected readonly endDateText = computed(() => {
    return this.form().get('endDateISO')?.value || '';
  });

  protected readonly hasEndDate = computed(() => {
    return !!this.form().get('endDateISO')?.value;
  });

  protected readonly isActiveText = computed(() => {
    return this.form().get('active')?.value ? 'Active' : 'Inactive';
  });

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
