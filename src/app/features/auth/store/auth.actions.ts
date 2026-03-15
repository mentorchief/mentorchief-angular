import { createAction, props } from '@ngrx/store';
import type { LoginPayload, SignupPayload } from '../../../core/models/auth.model';
import type { User } from '../../../core/models/user.model';

export const login = createAction(
  '[Auth] Login',
  props<{ payload: LoginPayload }>(),
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User }>(),
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>(),
);

export const signup = createAction(
  '[Auth] Signup',
  props<{ payload: SignupPayload }>(),
);

export const signupSuccess = createAction(
  '[Auth] Signup Success',
  props<{ user: User }>(),
);

export const signupFailure = createAction(
  '[Auth] Signup Failure',
  props<{ error: string }>(),
);

export const loadCurrentUser = createAction('[Auth] Load Current User');

export const loadCurrentUserSuccess = createAction(
  '[Auth] Load Current User Success',
  props<{ user: User | null }>(),
);

export const markRegistered = createAction(
  '[Auth] Mark Registered',
  props<{ updates?: Partial<User> }>(),
);

export const updateProfile = createAction(
  '[Auth] Update Profile',
  props<{ updates: Partial<User> }>(),
);

export const logout = createAction('[Auth] Logout');

