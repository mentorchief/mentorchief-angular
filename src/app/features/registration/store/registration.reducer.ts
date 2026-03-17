import { createReducer, on } from '@ngrx/store';
import type { RegistrationState, RegistrationData } from '../../../core/models/registration.model';
import { UserRole } from '../../../core/models/user.model';
import {
  hydrateFromSessionSuccess,
  resetData,
  setCurrentStep,
  updateData,
} from './registration.actions';

const initialData: RegistrationData = {
  role: null,
  firstName: '',
  lastName: '',
  phone: '',
  location: '',
  gender: '',
  photoUrl: null,
  jobTitle: '',
  company: '',
  yearsOfExperience: '',
  experiences: [],
  bio: '',
  skills: [],
  tools: [],
  portfolioUrl: '',
  subscriptionCost: 0,
  mentorPlans: [],
  availability: [],
  menteeCapacity: '',
};

const initialState: RegistrationState = {
  data: initialData,
  currentStep: 1,
  totalSteps: 5,
};

export const registrationReducer = createReducer(
  initialState,
  on(updateData, (state, { updates }): RegistrationState => {
    const data: RegistrationData = {
      ...state.data,
      ...updates,
    };
    const totalSteps = data.role === UserRole.Mentor ? 6 : 5;
    return {
      ...state,
      data,
      totalSteps,
    };
  }),
  on(resetData, (): RegistrationState => initialState),
  on(setCurrentStep, (state, { step }): RegistrationState => ({
    ...state,
    currentStep: step,
  })),
  on(hydrateFromSessionSuccess, (state, { data }): RegistrationState => {
    const totalSteps = data.role === UserRole.Mentor ? 6 : 5;
    return {
      ...state,
      data,
      totalSteps,
      currentStep: 1,
    };
  }),
);

