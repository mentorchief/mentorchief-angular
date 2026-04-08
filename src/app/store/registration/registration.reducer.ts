import { createReducer, on } from '@ngrx/store';
import { UserRole } from '../../core/models/user.model';
import type { RegistrationData, RegistrationState } from '../../core/models/registration.model';
import { RegistrationActions } from './registration.actions';

const emptyData = (): RegistrationData => ({
  role: null,
  firstName: '',
  lastName: '',
  phone: '',
  location: '',
  gender: '',
  photo: null,
  jobTitle: '',
  company: '',
  yearsOfExperience: '',
  experiences: [],
  bio: '',
  skills: [],
  tools: [],
  portfolioUrl: '',
  subscriptionCost: '',
  mentorPlans: [],
  menteeCapacity: '',
});

export const registrationInitialState: RegistrationState = {
  data: emptyData(),
  currentStep: 1,
  totalSteps: 5,
};

export const registrationReducer = createReducer(
  registrationInitialState,
  on(RegistrationActions.hydratedFromStorage, (_s, { state }): RegistrationState => state),
  on(RegistrationActions.updateData, (s, { updates }): RegistrationState => {
    const data = { ...s.data, ...updates };
    const totalSteps = data.role === UserRole.Mentor ? 6 : 5;
    return { ...s, data, totalSteps };
  }),
  on(RegistrationActions.setStep, (s, { step }): RegistrationState => ({ ...s, currentStep: step })),
  on(RegistrationActions.reset, (): RegistrationState => registrationInitialState),
);
