import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { RegistrationData, RegistrationState } from '../../core/models/registration.model';

export const RegistrationActions = createActionGroup({
  source: 'Registration',
  events: {
    Hydrate: emptyProps(),
    'Hydrated From Storage': props<{ state: RegistrationState }>(),
    'Update Data': props<{ updates: Partial<RegistrationData> }>(),
    'Set Step': props<{ step: number }>(),
    Reset: emptyProps(),
  },
});
