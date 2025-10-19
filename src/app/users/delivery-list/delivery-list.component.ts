import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AuthStore } from '../../store/features/auth.store';
import { UserStore } from '../../store/features/user.store';
import { UserListItem } from '../../store/models';

@Component({
  selector: 'app-delivery-list',
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
    MatTooltipModule
  ],
  providers: [
    UserStore
  ],
  templateUrl: './delivery-list.component.html',
  styleUrls: ['./delivery-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryListComponent implements OnInit {
  private readonly userStore = inject(UserStore);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  private readonly searchSubject = new Subject<string>();

  // Signals for component state
  protected readonly searchTerm = signal('');
  protected readonly displayedColumns = signal(['name', 'email', 'username', 'actions']);

  // Computed signals
  protected readonly deliveryUsers = computed(() => this.userStore.delivery());
  protected readonly pagination = computed(() => this.userStore.deliveryPagination());
  protected readonly loading = computed(() => this.userStore.loading());
  protected readonly error = computed(() => this.userStore.error());
  protected readonly currentUser = computed(() => this.authStore.user());

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
        this.loadDeliveryUsers();
      });
  }

  ngOnInit(): void {
    // Load initial data
    this.loadDeliveryUsers();
  }

  protected onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.searchSubject.next(target.value);
  }

  protected onPageChange(event: PageEvent): void {
    this.userStore.setCurrentPage(event.pageIndex + 1);
    this.userStore.setPageSize(event.pageSize);
    this.loadDeliveryUsers();
  }

  protected onRefresh(): void {
    this.loadDeliveryUsers();
  }

  private loadDeliveryUsers(): void {
    const params = {
      page: this.userStore.currentPage(),
      limit: this.userStore.pageSize(),
      search: this.userStore.searchTerm() || undefined,
    };

    this.userStore.loadDeliveryUsers(params);
  }

  protected formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  protected viewDeliveryUserCalendar(deliveryUser: UserListItem): void {
    this.router.navigate(['/calendar', deliveryUser.id]);
  }

  protected navigateToClients(): void {
    this.router.navigate(['/clients']);
  }
}
