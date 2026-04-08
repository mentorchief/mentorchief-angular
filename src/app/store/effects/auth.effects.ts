import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { delay, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { DEFAULT_MENTEE_CAPACITY } from '../../core/constants';
import { MentorApprovalStatus, UserRole, type User } from '../../core/models/user.model';
import { ROUTES } from '../../core/routes';
import { navigateAfterAuthLogin, getSafeMenteeReturnUrl } from '../../core/auth/post-login-navigation';
import { AuthActions } from '../auth/auth.actions';
import { UsersActions } from '../users/users.actions';
import { selectAllUsers } from '../users/users.selectors';
import { selectCurrentUser } from '../auth/auth.selectors';

const SESSION_KEY = 'mentorchief_userId';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  readonly restoreSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.restoreSession),
      map(() => {
        try {
          const userId = sessionStorage.getItem(SESSION_KEY);
          return AuthActions.sessionRestored({ userId });
        } catch {
          return AuthActions.sessionRestored({ userId: null });
        }
      }),
    ),
  );

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ payload }) =>
        of(null).pipe(
          delay(600),
          withLatestFrom(this.store.select(selectAllUsers)),
          switchMap(([_, users]) => {
            const email = payload.email.trim().toLowerCase();
            const user = users.find((u) => u.email.toLowerCase() === email);
            if (!user || user.password !== payload.password) {
              return of(
                AuthActions.loginFailure({
                  error:
                    'Invalid email or password. Try mentee@demo.com or mentor@demo.com with password123.',
                }),
              );
            }
            try {
              sessionStorage.setItem(SESSION_KEY, user.id);
            } catch {
              /* ignore */
            }
            return of(AuthActions.loginSuccess({ userId: user.id }));
          }),
        ),
      ),
    ),
  );

  readonly signup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.signup),
      switchMap(({ payload }) =>
        of(null).pipe(
          delay(600),
          withLatestFrom(this.store.select(selectAllUsers)),
          switchMap(([_, users]) => {
            const email = payload.email.trim().toLowerCase();
            const exists = users.find((u) => u.email.toLowerCase() === email);
            if (exists) {
              return of(AuthActions.signupFailure({ error: 'An account with this email already exists.' }));
            }
            const newUser: User = {
              id: `u${Date.now()}`,
              name: payload.name,
              email: payload.email.trim(),
              password: payload.password,
              role: payload.role,
              avatar: payload.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2),
              registered: false,
              status: 'active',
              joinDate: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              ...(payload.role === UserRole.Mentor
                ? {
                    mentorApprovalStatus: MentorApprovalStatus.Pending,
                    menteeCapacity: String(DEFAULT_MENTEE_CAPACITY),
                  }
                : {}),
            };
            try {
              sessionStorage.setItem(SESSION_KEY, newUser.id);
            } catch {
              /* ignore */
            }
            return of(
              UsersActions.addUser({ user: newUser }),
              AuthActions.signupSuccess({ userId: newUser.id }),
            );
          }),
        ),
      ),
    ),
  );

  readonly loginSuccessNavigate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        withLatestFrom(this.store.select(selectCurrentUser)),
        tap(([, user]) => {
          if (user) {
            navigateAfterAuthLogin(this.router, user, getSafeMenteeReturnUrl(this.router));
          }
        }),
      ),
    { dispatch: false },
  );

  readonly signupSuccessNavigate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.signupSuccess),
        withLatestFrom(this.store.select(selectCurrentUser)),
        tap(([, user]) => {
          if (!user) return;
          if (!user.registered) {
            try {
              sessionStorage.setItem(
                'mentorchief_signup_temp',
                JSON.stringify({ name: user.name, role: user.role }),
              );
            } catch {
              /* ignore */
            }
            void this.router.navigate([ROUTES.registration.roleInfo]);
          } else {
            navigateAfterAuthLogin(this.router, user, null);
          }
        }),
      ),
    { dispatch: false },
  );

  readonly logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          try {
            sessionStorage.removeItem(SESSION_KEY);
          } catch {
            /* ignore */
          }
          void this.router.navigate([ROUTES.login]);
        }),
      ),
    { dispatch: false },
  );
}
