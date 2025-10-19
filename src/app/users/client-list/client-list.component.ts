import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AddUserComponent } from '../../shared/add-user/add-user.component';
import { MealsViewComponent } from '../../shared/meals-view/meals-view.component';
import { AuthStore } from '../../store/features/auth.store';
import { UserStore } from '../../store/features/user.store';
import { UserListItem, UserType } from '../../store/models';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MealsViewComponent
  ],
  providers: [
    UserStore
  ],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientListComponent implements OnInit {
  private readonly userStore = inject(UserStore);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  private readonly searchSubject = new Subject<string>();

  // Signals for component state
  protected readonly searchTerm = signal('');
  protected readonly displayedColumns = signal(['name', 'mealsToday', 'actions']);

  // Computed signals
  protected readonly clients = computed(() => this.userStore.clients());
  protected readonly pagination = computed(() => this.userStore.clientsPagination());
  protected readonly loading = computed(() => this.userStore.loading());
  protected readonly error = computed(() => this.userStore.error());
  protected readonly currentUser = computed(() => this.authStore.user());
  protected readonly isAdmin = computed(() => this.currentUser()?.userType === UserType.ADMIN);

  constructor() {
    // Set up search debouncing with proper cleanup
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(searchTerm => {
        this.userStore.setSearchTerm(searchTerm);
        this.loadClients();
      });
  }

  ngOnInit(): void {
    // Load initial data
    this.loadClients();
  }

  protected onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.searchSubject.next(target.value);
  }

  protected onPageChange(event: PageEvent): void {
    this.userStore.setCurrentPage(event.pageIndex + 1);
    this.userStore.setPageSize(event.pageSize);
    this.loadClients();
  }

  protected onRefresh(): void {
    this.loadClients();
  }

  private loadClients(): void {
    const params = {
      page: this.userStore.currentPage(),
      limit: this.userStore.pageSize(),
      search: this.userStore.searchTerm() || undefined,
    };

    this.userStore.loadClients(params);
  }

  protected formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  protected viewClientCalendar(client: UserListItem): void {
    this.router.navigate(['/calendar', client.id]);
  }

  protected navigateToDeliveryUsers(): void {
    this.router.navigate(['/delivery']);
  }

  protected openAddUserDialog(): void {
    const dialogRef = this.dialog.open(AddUserComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      data: { userType: 'CLIENT' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Reload the clients list
        this.loadClients();
      }
    });
  }
}
