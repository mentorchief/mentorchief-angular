import { createAction, props } from '@ngrx/store';
import type { LoginPayload, SignupPayload } from '../../../core/models/auth.model';
import type { User } from '../../../core/models/user.model';
import { UserRole } from '../../../core/models/user.model';

export const login = createAction(
  '[Auth] Login',
  props<{ payload: LoginPayload }>(),
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ userId: string }>(),
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
  props<{ userId: string }>(),
);

export const signupFailure = createAction(
  '[Auth] Signup Failure',
  props<{ error: string }>(),
);

export const loadCurrentUser = createAction('[Auth] Load Current User');

export const loadCurrentUserSuccess = createAction(
  '[Auth] Load Current User Success',
  props<{ userId: string | null }>(),
);

export const markRegistered = createAction(
  '[Auth] Mark Registered',
  props<{ updates?: Partial<User> }>(),
);

export const markRegisteredSuccess = createAction(
  '[Auth] Mark Registered Success',
  props<{ role: UserRole }>(),
);

export const updateProfile = createAction(
  '[Auth] Update Profile',
  props<{ updates: Partial<User> }>(),
);

export const logout = createAction('[Auth] Logout');

export const switchActiveRole = createAction(
  '[Auth] Switch Active Role',
  props<{ role: UserRole }>(),
);

