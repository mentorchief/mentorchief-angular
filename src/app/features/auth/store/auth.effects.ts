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
import { resetSession } from '../../../store/session/session.actions';
import { ROUTES } from '../../../core/routes';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { selectAuthUser } from './auth.selectors';
import { MentorApprovalStatus, UserRole } from '../../../core/models/user.model';

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
          map((user) => loginSuccess({ userId: user.id })),
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
          map((user) => signupSuccess({ userId: user.id })),
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
          map((userId) => loadCurrentUserSuccess({ userId })),
          catchError(() => of(loadCurrentUserSuccess({ userId: null }))),
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

  readonly logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logout),
        switchMap(() => this.authApi.logout()),
        tap(() => {
          this.store.dispatch(resetSession());
          void this.router.navigate([ROUTES.login]);
        }),
      ),
    { dispatch: false },
  );

  readonly redirectAfterLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loginSuccess),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([, user]) => {
          if (!user) return;
          if (user.role === UserRole.Admin) {
            void this.router.navigate([ROUTES.admin.dashboard]);
          } else if (user.role === UserRole.Mentor) {
            const status = user.mentorApprovalStatus ?? 'approved';
            if (status === MentorApprovalStatus.Pending) void this.router.navigate([ROUTES.mentor.pending]);
            else if (status === MentorApprovalStatus.Rejected) void this.router.navigate([ROUTES.mentor.rejected]);
            else void this.router.navigate([ROUTES.mentor.dashboard]);
          } else {
            const returnUrl = this.getSafeReturnUrl();
            if (returnUrl) {
              void this.router.navigateByUrl(returnUrl);
            } else {
              void this.router.navigate([ROUTES.mentee.dashboard]);
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
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([, user]) => {
          if (!user) return;
          if (user.registered) {
            if (user.role === UserRole.Admin) {
              void this.router.navigate([ROUTES.admin.dashboard]);
            } else if (user.role === UserRole.Mentor) {
              const status = user.mentorApprovalStatus ?? 'approved';
              if (status === MentorApprovalStatus.Pending) void this.router.navigate(['/dashboard/mentor/pending']);
              else if (status === MentorApprovalStatus.Rejected) void this.router.navigate(['/dashboard/mentor/rejected']);
              else void this.router.navigate(['/dashboard/mentor']);
            } else {
              const returnUrl = this.getSafeReturnUrl();
              if (returnUrl) {
                void this.router.navigateByUrl(returnUrl);
              } else {
                void this.router.navigate([ROUTES.mentee.dashboard]);
              }
            }
          } else {
            const signupTemp = { name: user.name, role: user.role };
            sessionStorage.setItem(
              'mentorchief_signup_temp',
              JSON.stringify(signupTemp),
            );
            void this.router.navigate([ROUTES.registration.roleInfo]);
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

