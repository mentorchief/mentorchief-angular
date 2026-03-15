import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap, withLatestFrom } from 'rxjs';
import { UserRole } from '../../core/models/user.model';
import { selectAuthUser } from '../../features/auth/store/auth.selectors';
import { loadCurrentUserSuccess, loginSuccess, logout, markRegistered, signupSuccess } from '../../features/auth/store/auth.actions';
import { initializeForRole, resetSession } from './session.actions';
import {
  loadMentorData,
  resetMentor,
} from '../mentor';
import {
  loadMenteeData,
  resetMentee,
} from '../mentee';
import {
  loadAdminData,
  resetAdmin,
} from '../admin';
import {
  loadConversations,
  resetMessaging,
} from '../messaging';
import {
  loadReports,
  resetReports,
} from '../reports';
import { resetUsers } from '../users';
import { ADMIN_CHATS } from '../../core/data/chats.data';
import { initialMenteeReports, initialMentorProfileReviews } from '../reports/reports.data';
import { MENTOR_SEED } from '../mentor/mentor.seed';
import { MENTEE_SEED } from '../mentee/mentee.seed';
import { ADMIN_SEED } from '../admin/admin.seed';

@Injectable()
export class SessionEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);

  readonly initializeOnLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loginSuccess),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([, user]) => {
          if (user) this.store.dispatch(initializeForRole({ role: user.role }));
        }),
      ),
    { dispatch: false },
  );

  readonly initializeOnSignup$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(signupSuccess),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([, user]) => {
          if (user?.registered) {
            this.store.dispatch(initializeForRole({ role: user.role }));
          }
        }),
      ),
    { dispatch: false },
  );

  readonly initializeOnMarkRegistered$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(markRegistered),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([, user]) => {
          if (user) {
            this.store.dispatch(initializeForRole({ role: user.role }));
          }
        }),
      ),
    { dispatch: false },
  );

  readonly initializeOnLoadUser$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loadCurrentUserSuccess),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([{ userId }, user]) => {
          if (userId && user) {
            this.store.dispatch(initializeForRole({ role: user.role }));
          } else {
            this.store.dispatch(resetSession());
          }
        }),
      ),
    { dispatch: false },
  );

  readonly initializeForRole$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(initializeForRole),
        tap(({ role }) => {
          this.store.dispatch(loadConversations({
            conversations: ADMIN_CHATS,
            mentorUnread: role === UserRole.Mentor ? { 'conv-1': 1, 'conv-2': 2 } : {},
          }));
          this.store.dispatch(loadReports({
            menteeReviews: [],
            mentorProfileReviews: initialMentorProfileReviews,
            menteeReports: initialMenteeReports,
          }));
          if (role === UserRole.Mentor) {
            this.store.dispatch(loadMentorData(MENTOR_SEED));
          } else {
            this.store.dispatch(resetMentor());
          }
          if (role === UserRole.Mentee) {
            this.store.dispatch(loadMenteeData(MENTEE_SEED));
          } else {
            this.store.dispatch(resetMentee());
          }
          if (role === UserRole.Admin) {
            this.store.dispatch(loadAdminData(ADMIN_SEED));
          } else {
            this.store.dispatch(resetAdmin());
          }
        }),
      ),
    { dispatch: false },
  );

  readonly resetOnLogout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logout),
        tap(() => {
          this.store.dispatch(resetSession());
        }),
      ),
    { dispatch: false },
  );

  readonly resetSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(resetSession),
        tap(() => {
          this.store.dispatch(resetMentor());
          this.store.dispatch(resetMentee());
          this.store.dispatch(resetAdmin());
          this.store.dispatch(resetMessaging());
          this.store.dispatch(resetReports());
        }),
      ),
    { dispatch: false },
  );
}
