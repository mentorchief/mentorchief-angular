import { createFeatureSelector } from '@ngrx/store';
import type { RegistrationState } from '../../core/models/registration.model';

export const selectRegistrationState = createFeatureSelector<RegistrationState>('registration');
