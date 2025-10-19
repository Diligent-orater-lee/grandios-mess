import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { AuthStore } from '../store/features/auth.store';
import { PatternsStore } from '../store/features/patterns.store';
import { PatternDefinition, UserType } from '../store/models';
import { PatternListComponent } from './pattern-list/pattern-list.component';

@Component({
  selector: 'app-patterns',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule,
    MatSnackBarModule,
    PatternListComponent,
  ],
  providers: [PatternsStore],
  templateUrl: './patterns.component.html',
  styleUrl: './patterns.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternsComponent {
  private readonly router = inject(Router);
  private readonly patternsStore = inject(PatternsStore);
  private readonly authStore = inject(AuthStore);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly title = 'Meal Patterns';
  protected readonly description = 'Manage your meal patterns and preferences';

  // Computed signals
  protected readonly patterns = computed(() => this.patternsStore.patterns());
  protected readonly loading = computed(() => this.patternsStore.loading());
  protected readonly error = computed(() => this.patternsStore.error());
  protected readonly currentUser = computed(() => this.authStore.user());
  protected readonly isAdmin = computed(() => this.currentUser()?.userType === UserType.ADMIN);

  constructor() {
    // Load patterns on component initialization
    this.patternsStore.loadPatterns();
  }

  protected goBack(): void {
    this.router.navigate(['/']);
  }

  protected onCreateNew(): void {
    this.router.navigate(['/patterns/edit/new']);
  }

  protected onEdit(pattern: PatternDefinition): void {
    this.router.navigate(['/patterns/edit', pattern.id]);
  }

  protected onDelete(patternId: string): void {
    if (confirm('Are you sure you want to delete this pattern?')) {
      this.patternsStore.deletePattern(patternId);
      this.showSuccessMessage('Pattern deleted successfully');
    }
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
