import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../store/api/auth-api.service';
import { RegisterRequest, UserType } from '../../store/models';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddUserComponent {
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<AddUserComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  @Output() userAdded = new EventEmitter<void>();

  // Signals for component state
  protected readonly loading = signal(false);
  protected readonly userTypes = signal([
    { value: UserType.CLIENT, label: 'Client' },
    { value: UserType.DELIVERY, label: 'Delivery User' }
  ]);

  // Form
  protected readonly userForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    name: ['', [Validators.required]],
    userType: [UserType.CLIENT, [Validators.required]]
  });

  protected onSubmit(): void {
    if (this.userForm.valid && !this.loading()) {
      this.loading.set(true);

      const formData = {
        ...this.userForm.value,
        username: this.userForm.value.username?.toLowerCase()
      } as RegisterRequest;

      this.authService.adminRegister(formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.loading.set(false);
            this.snackBar.open('User created successfully!', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.userAdded.emit();
            this.dialogRef.close();
          },
          error: (error) => {
            this.loading.set(false);
            const errorMessage = error.error?.message || 'Failed to create user';
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  protected onCancel(): void {
    this.dialogRef.close();
  }

  protected getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must be at least ${requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      username: 'Username',
      password: 'Password',
      name: 'Full Name',
      userType: 'User Type'
    };
    return labels[fieldName] || fieldName;
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
}
