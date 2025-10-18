import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Location } from '@angular/common';

@Component({
  selector: 'app-patterns',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule,
  ],
  templateUrl: './patterns.component.html',
  styleUrl: './patterns.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternsComponent {
  private readonly location = inject(Location);

  protected readonly title = 'Meal Patterns';
  protected readonly description = 'Manage your meal patterns and preferences';

  protected goBack(): void {
    this.location.back();
  }
}
