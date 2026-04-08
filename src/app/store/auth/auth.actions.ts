import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { LoginPayload, SignupPayload } from '../../core/models/auth.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Restore Session': emptyProps(),
    'Session Restored': props<{ userId: string | null }>(),

    'Login': props<{ payload: LoginPayload }>(),
    'Login Success': props<{ userId: string }>(),
    'Login Failure': props<{ error: string }>(),

    'Signup': props<{ payload: SignupPayload }>(),
    'Signup Success': props<{ userId: string }>(),
    'Signup Failure': props<{ error: string }>(),

    Logout: emptyProps(),
    'Clear Error': emptyProps(),
  },
});
