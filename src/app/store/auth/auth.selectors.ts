import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { AuthState } from './auth.reducer';
import { selectAllUsers } from '../users/users.selectors';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAuthUserId = createSelector(selectAuthState, (s) => s.userId);
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.loading);
export const selectAuthError = createSelector(selectAuthState, (s) => s.error);

export const selectCurrentUser = createSelector(
  selectAuthUserId,
  selectAllUsers,
  (userId, users) => (userId ? users.find((u) => u.id === userId) ?? null : null),
);

export const selectIsAuthenticated = createSelector(selectAuthUserId, (id) => id !== null);
