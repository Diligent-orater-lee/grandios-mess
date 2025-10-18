import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { UserApiService } from '../api/user-api.service';
import { PaginationParams, UserListState } from '../models';

const initialState: UserListState = {
  clients: [],
  delivery: [],
  clientsPagination: null,
  deliveryPagination: null,
  loading: false,
  error: null,
  searchTerm: '',
  currentPage: 1,
  pageSize: 10,
};

export const UserStore = signalStore(
  withState(initialState),
  withMethods((store) => {
    const userApiService = inject(UserApiService);

    return {
      async loadClients(params: PaginationParams = {}) {
        patchState(store, { loading: true, error: null });

        try {
          const response = await userApiService.getClientUsers(params).toPromise();
          if (response) {
            patchState(store, {
              clients: response.data,
              clientsPagination: response.pagination,
              loading: false,
              error: null,
            });
          }
        } catch (error: any) {
          patchState(store, {
            loading: false,
            error: error.error?.message || 'Failed to load clients',
          });
        }
      },

      async loadDeliveryUsers(params: PaginationParams = {}) {
        patchState(store, { loading: true, error: null });

        try {
          const response = await userApiService.getDeliveryUsers(params).toPromise();
          if (response) {
            patchState(store, {
              delivery: response.data,
              deliveryPagination: response.pagination,
              loading: false,
              error: null,
            });
          }
        } catch (error: any) {
          patchState(store, {
            loading: false,
            error: error.error?.message || 'Failed to load delivery users',
          });
        }
      },

      setSearchTerm(searchTerm: string) {
        patchState(store, { searchTerm, currentPage: 1 });
      },

      setCurrentPage(page: number) {
        patchState(store, { currentPage: page });
      },

      setPageSize(pageSize: number) {
        patchState(store, { pageSize, currentPage: 1 });
      },

      clearError() {
        patchState(store, { error: null });
      },

      reset() {
        patchState(store, initialState);
      },
    };
  })
);
