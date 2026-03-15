import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { AuthState } from '../../../core/models/auth.model';
import { selectUserEntities } from '../../../store/users/users.selectors';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAuthUserId = createSelector(
  selectAuthState,
  (state) => state.userId,
);

/** Full user from users slice — single source of truth. Auth stores only userId. */
export const selectAuthUser = createSelector(
  selectAuthUserId,
  selectUserEntities,
  (userId, entities) => (userId ? (entities[userId] ?? null) : null),
);

export const selectIsAuthenticated = createSelector(
  selectAuthUserId,
  (userId) => !!userId,
);

export const selectIsRegistered = createSelector(
  selectAuthUser,
  (user) => user?.registered === true,
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state) => state.loading,
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state) => state.error,
);

