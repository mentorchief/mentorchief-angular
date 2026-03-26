import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { MentorApprovalStatus, UserRole, type User } from '../models/user.model';
import type { LoginPayload, SignupPayload } from '../models/auth.model';
import { UserService } from './user.service';
import { ROUTES } from '../routes';

const SESSION_KEY = 'mentorchief_userId';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  private readonly _currentUser$ = new BehaviorSubject<User | null>(null);
  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  private readonly _error$ = new BehaviorSubject<string | null>(null);

  readonly currentUser$ = this._currentUser$.asObservable();
  readonly loading$ = this._loading$.asObservable();
  readonly error$ = this._error$.asObservable();

  get currentUser(): User | null {
    return this._currentUser$.getValue();
  }

  get isAuthenticated(): boolean {
    return this._currentUser$.getValue() !== null;
  }

  /** Called once on app start. Restores session from sessionStorage. */
  initialize(): void {
    try {
      const userId = sessionStorage.getItem(SESSION_KEY);
      if (userId) {
        const user = this.userService.getById(userId);
        this._currentUser$.next(user);
      }
    } catch {
      // sessionStorage unavailable — stay logged out
    }
  }

  login(payload: LoginPayload): Observable<User> {
    this._loading$.next(true);
    this._error$.next(null);

    return of(null).pipe(
      delay(600),
      switchMap(() => {
        const user = this.userService.getByEmail(payload.email);
        if (!user || user.password !== payload.password) {
          return throwError(() => new Error('Invalid email or password. Try mentee@demo.com or mentor@demo.com with password123.'));
        }
        return of(user);
      }),
    );
  }

  loginSuccess(user: User): void {
    sessionStorage.setItem(SESSION_KEY, user.id);
    this._currentUser$.next(user);
    this._loading$.next(false);
    this._error$.next(null);
    this.redirectAfterLogin(user);
  }

  loginFailure(error: string): void {
    this._loading$.next(false);
    this._error$.next(error);
  }

  signup(payload: SignupPayload): Observable<User> {
    this._loading$.next(true);
    this._error$.next(null);

    return of(null).pipe(
      delay(600),
      switchMap(() => {
        const exists = this.userService.getByEmail(payload.email);
        if (exists) {
          return throwError(() => new Error('An account with this email already exists.'));
        }
        const newUser: User = {
          id: `u${Date.now()}`,
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: payload.role,
          avatar: payload.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
          registered: false,
          status: 'active',
          joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          ...(payload.role === UserRole.Mentor ? { mentorApprovalStatus: MentorApprovalStatus.Pending } : {}),
        };
        this.userService.add(newUser);
        return of(newUser);
      }),
    );
  }

  signupSuccess(user: User): void {
    sessionStorage.setItem(SESSION_KEY, user.id);
    this._currentUser$.next(user);
    this._loading$.next(false);
    this._error$.next(null);

    if (!user.registered) {
      const signupTemp = { name: user.name, role: user.role };
      sessionStorage.setItem('mentorchief_signup_temp', JSON.stringify(signupTemp));
      void this.router.navigate([ROUTES.registration.roleInfo]);
    } else {
      this.redirectAfterLogin(user);
    }
  }

  signupFailure(error: string): void {
    this._loading$.next(false);
    this._error$.next(error);
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this._currentUser$.next(null);
    void this.router.navigate([ROUTES.login]);
  }

  updateProfile(changes: Partial<User>): void {
    const user = this._currentUser$.getValue();
    if (!user) return;
    this.userService.update(user.id, changes);
    this._currentUser$.next({ ...user, ...changes });
  }

  markRegistered(changes?: Partial<User>): void {
    this.updateProfile({ registered: true, ...changes });
  }

  private redirectAfterLogin(user: User): void {
    if (user.role === UserRole.Admin) {
      void this.router.navigate([ROUTES.admin.dashboard]);
    } else if (user.role === UserRole.Mentor) {
      const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Approved;
      if (status === MentorApprovalStatus.Pending) void this.router.navigate([ROUTES.mentor.pending]);
      else if (status === MentorApprovalStatus.Rejected) void this.router.navigate([ROUTES.mentor.rejected]);
      else void this.router.navigate([ROUTES.mentor.dashboard]);
    } else {
      const returnUrl = this.getSafeReturnUrl();
      if (returnUrl) void this.router.navigateByUrl(returnUrl);
      else void this.router.navigate([ROUTES.mentee.dashboard]);
    }
  }

  private getSafeReturnUrl(): string | null {
    const urlTree = this.router.parseUrl(this.router.url);
    const returnUrl = urlTree.queryParams['returnUrl'];
    if (typeof returnUrl !== 'string' || !returnUrl.startsWith('/mentor/') || returnUrl.includes('..')) {
      return null;
    }
    return returnUrl;
  }
}
