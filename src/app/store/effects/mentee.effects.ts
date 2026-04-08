import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import { delay, switchMap, withLatestFrom } from 'rxjs/operators';
import type { PendingMentorshipRequest } from '../../core/models/dashboard.model';
import { MentorActions } from '../mentor/mentor.actions';
import { MenteeActions } from '../mentee/mentee.actions';
import { selectCurrentUser } from '../auth/auth.selectors';
import { selectMentorState } from '../mentor/mentor.selectors';

@Injectable()
export class MenteeEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);

  readonly requestMentorship$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MenteeActions.requestMentorship),
      switchMap(({ mentorId, plan, message }) =>
        of(null).pipe(
          delay(250),
          withLatestFrom(this.store.select(selectCurrentUser), this.store.select(selectMentorState)),
          switchMap(([_, user, mentor]) => {
            if (!user) return EMPTY;

            const nextId = mentor.pendingRequests.length
              ? Math.max(...mentor.pendingRequests.map((r) => r.id)) + 1
              : 1;

            const goal =
              plan === 'monthly' ? 'Monthly' : plan === 'quarterly' ? 'Quarterly' : plan === '6months' ? '6 Months' : plan;

            const request: PendingMentorshipRequest = {
              id: nextId,
              mentorId,
              menteeId: user.id,
              name: user.name,
              goal,
              message: message ?? '',
              rating: null,
            };

            return of(MentorActions.addPendingRequest({ request }));
          }),
        ),
      ),
    ),
  );

  readonly cancelMentorshipRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MenteeActions.cancelMentorshipRequest),
      switchMap(({ mentorId }) =>
        of(null).pipe(
          delay(200),
          withLatestFrom(this.store.select(selectCurrentUser), this.store.select(selectMentorState)),
          switchMap(([_, user, mentor]) => {
            if (!user) return EMPTY;

            const req =
              mentor.pendingRequests.find((r) => r.menteeId === user.id && (r.mentorId ?? '') === mentorId) ??
              mentor.pendingRequests.find((r) => r.menteeId === user.id);

            if (!req) return EMPTY;

            return of(MentorActions.declineRequest({ requestId: req.id }));
          }),
        ),
      ),
    ),
  );
}

