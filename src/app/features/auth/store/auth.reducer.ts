import { createReducer, on } from '@ngrx/store';
import type { AuthState } from '../../../core/models/auth.model';
import {
  loadCurrentUserSuccess,
  login,
  loginFailure,
  loginSuccess,
  logout,
  signup,
  signupFailure,
  signupSuccess,
  switchActiveRole,
} from './auth.actions';

const initialState: AuthState = {
  userId: null,
  activeRole: null,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,
  on(login, signup, (state): AuthState => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(loginSuccess, signupSuccess, (state, { userId }): AuthState => ({
    ...state,
    userId,
    loading: false,
    error: null,
  })),
  on(loginFailure, signupFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error,
  })),
  on(loadCurrentUserSuccess, (state, { userId }): AuthState => ({
    ...state,
    userId: userId ?? null,
  })),
  on(logout, (): AuthState => initialState),
  on(switchActiveRole, (state, { role }): AuthState => ({
    ...state,
    activeRole: role,
  })),
);

