import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';

export interface AuthState {
  userId: string | null;
  loading: boolean;
  error: string | null;
}

export const authInitialState: AuthState = {
  userId: null,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  authInitialState,
  on(AuthActions.sessionRestored, (state, { userId }): AuthState => ({
    ...state,
    userId,
    loading: false,
    error: null,
  })),
  on(AuthActions.login, AuthActions.signup, (state): AuthState => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AuthActions.loginSuccess, AuthActions.signupSuccess, (state, { userId }): AuthState => ({
    ...state,
    userId,
    loading: false,
    error: null,
  })),
  on(AuthActions.loginFailure, AuthActions.signupFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error,
  })),
  on(AuthActions.logout, (): AuthState => ({
    ...authInitialState,
  })),
  on(AuthActions.clearError, (state): AuthState => ({
    ...state,
    error: null,
  })),
);
