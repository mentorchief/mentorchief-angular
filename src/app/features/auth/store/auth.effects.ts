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
import { addUser, updateUserProfile } from '../../../store/users/users.actions';
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

  /** Login: fetch full user from Supabase, hydrate users store, then dispatch loginSuccess */
  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(login),
      switchMap(({ payload }) =>
        this.authApi.login(payload).pipe(
          tap((user) => this.store.dispatch(addUser({ user }))),
          map((user) => loginSuccess({ userId: user.id })),
          catchError((error: unknown) =>
            of(loginFailure({ error: error instanceof Error ? error.message : 'Login failed.' })),
          ),
        ),
      ),
    ),
  );

  /** Signup: fetch full user from Supabase, hydrate users store, then dispatch signupSuccess */
  readonly signup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(signup),
      switchMap(({ payload }) =>
        this.authApi.signup(payload).pipe(
          tap((user) => this.store.dispatch(addUser({ user }))),
          map((user) => signupSuccess({ userId: user.id })),
          catchError((error: unknown) =>
            of(signupFailure({ error: error instanceof Error ? error.message : 'Signup failed.' })),
          ),
        ),
      ),
    ),
  );

  /** App init: restore session from Supabase, load profile, hydrate users store */
  readonly loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCurrentUser),
      switchMap(() =>
        this.authApi.loadCurrentUser().pipe(
          switchMap((userId) => {
            if (!userId) return of(loadCurrentUserSuccess({ userId: null }));
            return this.authApi.getProfileById(userId).pipe(
              tap((user) => { if (user) this.store.dispatch(addUser({ user })); }),
              map(() => loadCurrentUserSuccess({ userId })),
            );
          }),
          catchError(() => of(loadCurrentUserSuccess({ userId: null }))),
        ),
      ),
    ),
  );

  /** updateProfile: persist to Supabase then update users store */
  readonly updateProfile$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(updateProfile),
        switchMap(({ updates }) =>
          this.authApi.updateProfile(updates).pipe(
            tap((user) => {
              if (user) this.store.dispatch(updateUserProfile({ userId: user.id, updates }));
            }),
          ),
        ),
      ),
    { dispatch: false },
  );

  /** markRegistered: persist to Supabase then update users store */
  readonly markRegistered$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(markRegistered),
        switchMap(({ updates }) =>
          this.authApi.markRegistered(updates).pipe(
            tap((user) => {
              if (user) this.store.dispatch(updateUserProfile({ userId: user.id, updates: { registered: true, ...updates } }));
            }),
          ),
        ),
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
            if (returnUrl) void this.router.navigateByUrl(returnUrl);
            else void this.router.navigate([ROUTES.mentee.dashboard]);
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
              if (status === MentorApprovalStatus.Pending) void this.router.navigate([ROUTES.mentor.pending]);
              else if (status === MentorApprovalStatus.Rejected) void this.router.navigate([ROUTES.mentor.rejected]);
              else void this.router.navigate([ROUTES.mentor.dashboard]);
            } else {
              const returnUrl = this.getSafeReturnUrl();
              if (returnUrl) void this.router.navigateByUrl(returnUrl);
              else void this.router.navigate([ROUTES.mentee.dashboard]);
            }
          } else {
            sessionStorage.setItem('mentorchief_signup_temp', JSON.stringify({ name: user.name, role: user.role }));
            void this.router.navigate([ROUTES.registration.roleInfo]);
          }
        }),
      ),
    { dispatch: false },
  );

  private getSafeReturnUrl(): string | null {
    const urlTree = this.router.parseUrl(this.router.url);
    const returnUrl = urlTree.queryParams['returnUrl'];
    if (typeof returnUrl !== 'string' || !returnUrl.startsWith('/mentor/') || returnUrl.includes('..')) return null;
    return returnUrl;
  }
}
