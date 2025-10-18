import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, filter, map } from 'rxjs';
import { PatternsApiService } from '../api/patterns-api.service';
import { CreatePatternDto, PatternDefinition, UpdatePatternDto } from '../models';

interface PatternsState {
  patterns: PatternDefinition[];
  loading: boolean;
  error: string | null;
  selectedUserId: string | undefined;
  currentPattern: PatternDefinition | null;
}

const initialState: PatternsState = {
  patterns: [],
  loading: false,
  error: null,
  selectedUserId: undefined,
  currentPattern: null,
};

export const PatternsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const api = inject(PatternsApiService);

    return {
      setSelectedUserId(userId: string | undefined) {
        patchState(store, { selectedUserId: userId });
      },

      loadPatterns: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() => {
            const userId = store.selectedUserId();
            return api.getPatterns(userId);
          }),
          tap({
            next: (response) => {
              patchState(store, { 
                patterns: response.data, 
                loading: false, 
                error: null 
              });
            },
            error: (error) => {
              patchState(store, { 
                loading: false, 
                error: error.error?.message || 'Failed to load patterns' 
              });
            }
          })
        )
      ),

      createPattern: rxMethod<CreatePatternDto>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((pattern) => {
            const userId = store.selectedUserId();
            const patternWithUserId = userId ? { ...pattern, userId } : pattern;
            return api.createPattern(patternWithUserId);
          }),
          tap({
            next: (response) => {
              const currentPatterns = store.patterns();
              patchState(store, { 
                patterns: [...currentPatterns, response.data],
                loading: false, 
                error: null 
              });
            },
            error: (error) => {
              patchState(store, { 
                loading: false, 
                error: error.error?.message || 'Failed to create pattern' 
              });
            }
          })
        )
      ),

      updatePattern: rxMethod<{ id: string; updates: UpdatePatternDto }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(({ id, updates }) => {
            const userId = store.selectedUserId();
            return api.updatePattern(id, updates, userId);
          }),
          tap({
            next: (response) => {
              const currentPatterns = store.patterns();
              const updatedPatterns = currentPatterns.map(p => 
                p.id === response.data.id ? response.data : p
              );
              patchState(store, { 
                patterns: updatedPatterns,
                loading: false, 
                error: null 
              });
            },
            error: (error) => {
              patchState(store, { 
                loading: false, 
                error: error.error?.message || 'Failed to update pattern' 
              });
            }
          })
        )
      ),

      deletePattern: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((id) => {
            const userId = store.selectedUserId();
            return api.deletePattern(id, userId).pipe(
              tap({
                next: () => {
                  const currentPatterns = store.patterns();
                  const filteredPatterns = currentPatterns.filter(p => p.id !== id);
                  patchState(store, { 
                    patterns: filteredPatterns,
                    loading: false, 
                    error: null 
                  });
                },
                error: (error) => {
                  patchState(store, { 
                    loading: false, 
                    error: error.error?.message || 'Failed to delete pattern' 
                  });
                }
              })
            );
          })
        )
      ),

      clearError() {
        patchState(store, { error: null });
      },

      getPattern: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((id) => {
            const userId = store.selectedUserId();
            return api.getPattern(id, userId);
          }),
          tap({
            next: (response) => {
              patchState(store, { 
                currentPattern: response.data,
                loading: false, 
                error: null 
              });
            },
            error: (error) => {
              patchState(store, { 
                loading: false, 
                error: error.error?.message || 'Failed to load pattern' 
              });
            }
          })
        )
      ),

      loadPatternFromRoute: rxMethod<any>(
        pipe(
          map((paramMap) => paramMap.get('id')),
          filter((id) => id && id !== 'new'),
          tap((id) => patchState(store, { loading: true, error: null })),
          switchMap((id) => {
            const userId = store.selectedUserId();
            return api.getPattern(id, userId);
          }),
          tap({
            next: (response) => {
              patchState(store, { 
                currentPattern: response.data,
                loading: false, 
                error: null 
              });
            },
            error: (error) => {
              patchState(store, { 
                loading: false, 
                error: error.error?.message || 'Failed to load pattern' 
              });
            }
          })
        )
      ),

      togglePatternActive: rxMethod<{ id: string; active: boolean }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(({ id, active }) => {
            const userId = store.selectedUserId();
            return api.updatePattern(id, { active }, userId);
          }),
          tap({
            next: (response) => {
              const currentPatterns = store.patterns();
              const updatedPatterns = currentPatterns.map(p => 
                p.id === response.data.id ? response.data : p
              );
              patchState(store, { 
                patterns: updatedPatterns,
                loading: false, 
                error: null 
              });
            },
            error: (error) => {
              patchState(store, { 
                loading: false, 
                error: error.error?.message || 'Failed to toggle pattern' 
              });
            }
          })
        )
      ),
    };
  })
);
