import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthStore } from '../../store/features/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  protected readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);

  public loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  onLogin() {
    if (this.loginForm.valid) {
      const data = {
        username: this.loginForm.value.username?.toLowerCase(),
        password: this.loginForm.value.password
      }
      this.authStore.login(data as { username: string; password: string });
    }
  }
}
