import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserStore } from '../../store/features/user.store';
import { AuthStore } from '../../store/features/auth.store';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientListComponent implements OnInit {
  private readonly userStore = inject(UserStore);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchSubject = new Subject<string>();

  // Signals for component state
  protected readonly searchTerm = signal('');
  protected readonly displayedColumns = signal(['username', 'email', 'name', 'userType', 'createdAt']);

  // Computed signals
  protected readonly clients = computed(() => this.userStore.clients());
  protected readonly pagination = computed(() => this.userStore.clientsPagination());
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

  protected getUserTypeDisplay(userType: string): string {
    return userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase();
  }
}
