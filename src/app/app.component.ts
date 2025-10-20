import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';
import { AuthStore } from './store/features/auth.store';
import { UserType } from './store/models';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  // Expose UserType enum to template
  protected readonly UserType = UserType;
  protected readonly isAuthenticated = this.authStore.isAuthenticated;
  protected readonly user = this.authStore.user;

  logout() {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
