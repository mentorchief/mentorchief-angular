import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap, withLatestFrom } from 'rxjs';
import { selectAuthUser } from '../../features/auth/store/auth.selectors';
import { loadCurrentUserSuccess, loginSuccess, logout, markRegistered, signupSuccess } from '../../features/auth/store/auth.actions';
import { initializeForRole, resetSession } from './session.actions';
import { resetMentor } from '../mentor';
import { resetMentee } from '../mentee';
import { resetAdmin } from '../admin';
import { resetMessaging } from '../messaging';
import { resetReports } from '../reports';
import { resetUsers } from '../users';

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
        tap(({ role: _role }) => {
          this.store.dispatch(resetMentor());
          this.store.dispatch(resetMentee());
          this.store.dispatch(resetAdmin());
          this.store.dispatch(resetMessaging());
          this.store.dispatch(resetReports());
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
