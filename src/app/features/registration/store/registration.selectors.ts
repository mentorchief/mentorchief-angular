import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { RegistrationState } from '../../../core/models/registration.model';

export const selectRegistrationState = createFeatureSelector<RegistrationState>('registration');

export const selectRegistrationData = createSelector(
  selectRegistrationState,
  (state) => state.data,
);

export const selectRegistrationCurrentStep = createSelector(
  selectRegistrationState,
  (state) => state.currentStep,
);

export const selectRegistrationTotalSteps = createSelector(
  selectRegistrationState,
  (state) => state.totalSteps,
);

