import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import {
  loadCurrentUser,
  loadCurrentUserSuccess,
  login,
  loginFailure,
  loginSuccess,
  logout,
  markRegistered,
  signup,
  signupFailure,
  signupSuccess,
  updateProfile,
} from './auth.actions';
import { initializeDashboardForRole, resetDashboard } from '../../dashboard/store/dashboard.actions';
import { selectAuthUser } from './auth.selectors';
import { AuthApiService } from '../../../core/services/auth-api.service';
import type { User } from '../../../core/models/user.model';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(login),
      switchMap(({ payload }) =>
        this.authApi.login(payload).pipe(
          map((user: User) => loginSuccess({ user })),
          catchError((error: unknown) =>
            of(
              loginFailure({
                error: error instanceof Error ? error.message : 'Login failed.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  readonly signup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(signup),
      switchMap(({ payload }) =>
        this.authApi.signup(payload).pipe(
          map((user: User) => signupSuccess({ user })),
          catchError((error: unknown) =>
            of(
              signupFailure({
                error: error instanceof Error ? error.message : 'Signup failed.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  readonly loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCurrentUser),
      switchMap(() =>
        this.authApi.loadCurrentUser().pipe(
          map((user) => loadCurrentUserSuccess({ user })),
          catchError(() => of(loadCurrentUserSuccess({ user: null }))),
        ),
      ),
    ),
  );

  readonly updateProfile$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(updateProfile),
        switchMap(({ updates }) => this.authApi.updateProfile(updates)),
      ),
    { dispatch: false },
  );

  readonly markRegistered$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(markRegistered),
        switchMap(({ updates }) => this.authApi.markRegistered(updates)),
      ),
    { dispatch: false },
  );

  readonly initializeDashboardOnMarkRegistered$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(markRegistered),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([, user]) => {
          if (user) {
            this.store.dispatch(initializeDashboardForRole({ role: user.role }));
          }
        }),
      ),
    { dispatch: false },
  );

  readonly logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logout),
        switchMap(() => this.authApi.logout()),
        tap(() => {
          this.store.dispatch(resetDashboard());
          void this.router.navigate(['/login']);
        }),
      ),
    { dispatch: false },
  );

  readonly initializeDashboardOnLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loginSuccess),
        tap(({ user }) => this.store.dispatch(initializeDashboardForRole({ role: user.role }))),
      ),
    { dispatch: false },
  );

  readonly initializeDashboardOnSignup$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(signupSuccess),
        tap(({ user }) => {
          if (user.registered) {
            this.store.dispatch(initializeDashboardForRole({ role: user.role }));
          }
        }),
      ),
    { dispatch: false },
  );

  readonly initializeDashboardOnLoadUser$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loadCurrentUserSuccess),
        tap(({ user }) => {
          if (user) {
            this.store.dispatch(initializeDashboardForRole({ role: user.role }));
          } else {
            this.store.dispatch(resetDashboard());
          }
        }),
      ),
    { dispatch: false },
  );

  readonly redirectAfterLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loginSuccess),
        tap(({ user }) => {
          if (user.role === 'admin') {
            void this.router.navigate(['/dashboard/admin']);
          } else if (user.role === 'mentor') {
            const status = user.mentorApprovalStatus ?? 'approved';
            if (status === 'pending') void this.router.navigate(['/dashboard/mentor/pending']);
            else if (status === 'rejected') void this.router.navigate(['/dashboard/mentor/rejected']);
            else void this.router.navigate(['/dashboard/mentor']);
          } else {
            const returnUrl = this.getSafeReturnUrl();
            if (returnUrl) {
              void this.router.navigateByUrl(returnUrl);
            } else {
              void this.router.navigate(['/dashboard/mentee']);
            }
          }
        }),
      ),
    { dispatch: false },
  );

  readonly redirectAfterSignup$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(signupSuccess),
        tap(({ user }) => {
          if (user.registered) {
            if (user.role === 'admin') {
              void this.router.navigate(['/dashboard/admin']);
            } else if (user.role === 'mentor') {
              const status = user.mentorApprovalStatus ?? 'approved';
              if (status === 'pending') void this.router.navigate(['/dashboard/mentor/pending']);
              else if (status === 'rejected') void this.router.navigate(['/dashboard/mentor/rejected']);
              else void this.router.navigate(['/dashboard/mentor']);
            } else {
              const returnUrl = this.getSafeReturnUrl();
              if (returnUrl) {
                void this.router.navigateByUrl(returnUrl);
              } else {
                void this.router.navigate(['/dashboard/mentee']);
              }
            }
          } else {
            const signupTemp = { name: user.name, role: user.role };
            sessionStorage.setItem(
              'mentorchief_signup_temp',
              JSON.stringify(signupTemp),
            );
            void this.router.navigate(['/auth/registration-steps/role-info']);
          }
        }),
      ),
    { dispatch: false },
  );

  /** Return URL from current route if safe for mentee (mentor profile/request only). */
  private getSafeReturnUrl(): string | null {
    const urlTree = this.router.parseUrl(this.router.url);
    const returnUrl = urlTree.queryParams['returnUrl'];
    if (typeof returnUrl !== 'string' || !returnUrl.startsWith('/mentor/') || returnUrl.includes('..')) {
      return null;
    }
    return returnUrl;
  }
}

