import { createAction, props } from '@ngrx/store';
import type { RegistrationData } from '../../../core/models/registration.model';

export const updateData = createAction(
  '[Registration] Update Data',
  props<{ updates: Partial<RegistrationData> }>(),
);

export const resetData = createAction('[Registration] Reset Data');

export const setCurrentStep = createAction(
  '[Registration] Set Current Step',
  props<{ step: number }>(),
);

export const hydrateFromSession = createAction('[Registration] Hydrate From Session');

export const hydrateFromSessionSuccess = createAction(
  '[Registration] Hydrate From Session Success',
  props<{ data: RegistrationData }>(),
);

