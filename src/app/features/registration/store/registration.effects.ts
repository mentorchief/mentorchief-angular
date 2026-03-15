import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import {
  hydrateFromSession,
  hydrateFromSessionSuccess,
} from './registration.actions';
import type { RegistrationData } from '../../../core/models/registration.model';
import { UserRole } from '../../../core/models/user.model';

const SIGNUP_TEMP_KEY = 'mentorchief_signup_temp';

@Injectable()
export class RegistrationEffects {
  private readonly actions$ = inject(Actions);

  readonly hydrateFromSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(hydrateFromSession),
      switchMap(() => {
        try {
          const raw = sessionStorage.getItem(SIGNUP_TEMP_KEY);
          if (!raw) {
            return of(
              hydrateFromSessionSuccess({
                data: this.createEmptyData(),
              }),
            );
          }

          const parsed = JSON.parse(raw) as {
            name?: string;
            role?: UserRole;
          };

          const [firstName, ...lastNameParts] = (parsed.name ?? '').split(' ');

          const data: RegistrationData = {
            ...this.createEmptyData(),
            role: parsed.role === UserRole.Mentee || parsed.role === UserRole.Mentor ? parsed.role : null,
            firstName: firstName ?? '',
            lastName: lastNameParts.join(' ') ?? '',
          };

          return of(
            hydrateFromSessionSuccess({
              data,
            }),
          );
        } catch {
          return of(
            hydrateFromSessionSuccess({
              data: this.createEmptyData(),
            }),
          );
        }
      }),
      catchError(() =>
        of(
          hydrateFromSessionSuccess({
            data: this.createEmptyData(),
          }),
        ),
      ),
    ),
  );

  private createEmptyData(): RegistrationData {
    return {
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
      availability: [],
      menteeCapacity: '',
    };
  }
}

