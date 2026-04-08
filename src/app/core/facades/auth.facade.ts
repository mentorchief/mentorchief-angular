import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import type { LoginPayload, SignupPayload } from '../models/auth.model';
import type { User } from '../models/user.model';
import { ROUTES } from '../routes';
import { navigateAfterAuthLogin, getSafeMenteeReturnUrl } from '../auth/post-login-navigation';
import { AuthActions } from '../../store/auth/auth.actions';
import { UsersActions } from '../../store/users/users.actions';
import {
  selectAuthError,
  selectAuthLoading,
  selectCurrentUser,
  selectIsAuthenticated,
} from '../../store/auth/auth.selectors';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  readonly currentUser$ = this.store.select(selectCurrentUser);
  readonly loading$ = this.store.select(selectAuthLoading);
  readonly error$ = this.store.select(selectAuthError);
  readonly isAuthenticated$ = this.store.select(selectIsAuthenticated);

  private readonly _currentUser = toSignal(this.store.select(selectCurrentUser), {
    initialValue: null as User | null,
  });

  /** Synchronous snapshot for guards and legacy call sites (backed by the store). */
  get currentUser(): User | null {
    return this._currentUser();
  }

  get isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  initializeSession(): void {
    this.store.dispatch(AuthActions.restoreSession());
  }

  login(payload: LoginPayload): void {
    this.store.dispatch(AuthActions.login({ payload }));
  }

  signup(payload: SignupPayload): void {
    this.store.dispatch(AuthActions.signup({ payload }));
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  clearError(): void {
    this.store.dispatch(AuthActions.clearError());
  }

  updateProfile(changes: Partial<User>): void {
    const user = this.currentUser;
    if (!user) return;
    this.store.dispatch(UsersActions.updateUser({ id: user.id, changes }));
  }

  markRegistered(changes?: Partial<User>): void {
    this.updateProfile({ registered: true, ...changes });
  }

  ensureGuestOrRedirectForLogin(): void {
    const user = this.currentUser;
    if (user) navigateAfterAuthLogin(this.router, user, getSafeMenteeReturnUrl(this.router));
  }

  ensureGuestOrRedirectForSignup(): void {
    const user = this.currentUser;
    if (!user) return;
    if (!user.registered) void this.router.navigate([ROUTES.registration.roleInfo]);
    else navigateAfterAuthLogin(this.router, user, null);
  }
}
