import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { delay, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { MentorApprovalStatus } from '../../core/models/user.model';
import { ToastService } from '../../shared/services/toast.service';
import { UsersActions } from '../users/users.actions';
import { selectUserById } from '../users/users.selectors';

@Injectable()
export class UsersEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly toast = inject(ToastService);

  readonly approveMentorRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.approveMentorRequest),
      switchMap(({ userId }) =>
        of(null).pipe(
          delay(300),
          withLatestFrom(this.store.select(selectUserById(userId))),
          tap(([_, user]) => {
            if (user) this.toast.success(`${user.name} has been approved as a mentor.`);
          }),
          map(() =>
            UsersActions.setMentorApproval({
              id: userId,
              mentorApprovalStatus: MentorApprovalStatus.Approved,
            }),
          ),
        ),
      ),
    ),
  );

  readonly rejectMentorRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.rejectMentorRequest),
      switchMap(({ userId }) =>
        of(null).pipe(
          delay(300),
          withLatestFrom(this.store.select(selectUserById(userId))),
          tap(([_, user]) => {
            if (user) this.toast.success(`${user.name}'s application has been rejected.`);
          }),
          map(() =>
            UsersActions.setMentorApproval({
              id: userId,
              mentorApprovalStatus: MentorApprovalStatus.Rejected,
            }),
          ),
        ),
      ),
    ),
  );
}
