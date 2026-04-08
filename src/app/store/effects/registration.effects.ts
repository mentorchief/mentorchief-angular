import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { UserRole } from '../../core/models/user.model';
import type { RegistrationData, RegistrationState } from '../../core/models/registration.model';
import { RegistrationActions } from '../registration/registration.actions';

const SIGNUP_TEMP_KEY = 'mentorchief_signup_temp';

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

@Injectable()
export class RegistrationEffects {
  private readonly actions$ = inject(Actions);

  readonly hydrate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RegistrationActions.hydrate),
      mergeMap(() => {
        try {
          const raw = sessionStorage.getItem(SIGNUP_TEMP_KEY);
          if (!raw) return EMPTY;
          const parsed = JSON.parse(raw) as { name?: string; role?: UserRole };
          const [firstName, ...rest] = (parsed.name ?? '').split(' ');
          const data: RegistrationData = {
            ...emptyData(),
            role: parsed.role === UserRole.Mentee || parsed.role === UserRole.Mentor ? parsed.role : null,
            firstName: firstName ?? '',
            lastName: rest.join(' '),
          };
          const state: RegistrationState = {
            data,
            currentStep: 1,
            totalSteps: data.role === UserRole.Mentor ? 6 : 5,
          };
          return of(RegistrationActions.hydratedFromStorage({ state }));
        } catch {
          return EMPTY;
        }
      }),
    ),
  );
}
