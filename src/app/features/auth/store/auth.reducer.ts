import { createReducer, on } from '@ngrx/store';
import type { AuthState } from '../../../core/models/auth.model';
import {
  loadCurrentUserSuccess,
  login,
  loginFailure,
  loginSuccess,
  logout,
  markRegistered,
  signup,
  signupFailure,
  signupSuccess,
  updateProfile,
} from './auth.actions';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isRegistered: false,
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
  on(loginSuccess, signupSuccess, (state, { user }): AuthState => ({
    ...state,
    user,
    isAuthenticated: true,
    isRegistered: user.registered === true,
    loading: false,
    error: null,
  })),
  on(loginFailure, signupFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error,
  })),
  on(loadCurrentUserSuccess, (state, { user }): AuthState => ({
    ...state,
    user,
    isAuthenticated: !!user,
    isRegistered: user?.registered === true,
  })),
  on(markRegistered, (state, { updates }): AuthState => {
    const user = state.user;
    if (!user) {
      return state;
    }
    const updatedUser = {
      ...user,
      registered: true,
      ...updates,
    };
    return {
      ...state,
      user: updatedUser,
      isRegistered: true,
    };
  }),
  on(updateProfile, (state, { updates }): AuthState => {
    const user = state.user;
    if (!user) {
      return state;
    }
    const updatedUser = {
      ...user,
      ...updates,
    };
    return {
      ...state,
      user: updatedUser,
    };
  }),
  on(logout, (): AuthState => initialState),
);

