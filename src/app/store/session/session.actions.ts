import { createAction, props } from '@ngrx/store';
import { UserRole } from '../../core/models/user.model';

/** Initialize all feature slices for the given role (called on login/signup/load user). */
export const initializeForRole = createAction(
  '[Session] Initialize For Role',
  props<{ role: UserRole }>(),
);

/** Reset all role-specific slices (called on logout). Users and platform are preserved. */
export const resetSession = createAction('[Session] Reset');
