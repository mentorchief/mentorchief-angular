import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, switchMap, take } from 'rxjs/operators';
import type { LoginPayload, SignupPayload } from '../models/auth.model';
import { MentorApprovalStatus, UserRole, type User } from '../models/user.model';
import type { AppState } from '../../store/app.state';
import { selectPlatformUsers } from '../../store/users/users.selectors';
import { addUser, setMentorApprovalStatus, updateUserProfile } from '../../store/users/users.actions';

const SESSION_KEY = 'mentorchief_userId';

/**
 * Auth API (mock). Single source of truth: users slice.
 * Session stores only userId — no user data duplication.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly store = inject(Store<AppState>);

  login(payload: LoginPayload): Observable<User> {
    const { email, password } = payload;
    return (this.store.select(selectPlatformUsers) as Observable<User[]>).pipe(
      take(1),
      delay(600),
      switchMap((users: User[]) => {
        const found = users.find(
          (u: User) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
        );
        if (!found) {
          return throwError(
            () =>
              new Error(
                'Invalid email or password. Try mentee@demo.com or mentor@demo.com with password123.',
              ),
          );
        }
        sessionStorage.setItem(SESSION_KEY, found.id);
        return of(found);
      }),
    );
  }

  signup(payload: SignupPayload): Observable<User> {
    const { name, email, password, role } = payload;
    return (this.store.select(selectPlatformUsers) as Observable<User[]>).pipe(
      take(1),
      switchMap((users: User[]) => {
        const exists = users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          return throwError(() => new Error('An account with this email already exists.')).pipe(
            delay(600),
          );
        }
        const newUser: User = {
          id: `u${Date.now()}`,
          name,
          email,
          password,
          role,
          avatar: name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
          registered: false,
          status: 'active',
          joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          ...(role === UserRole.Mentor ? { mentorApprovalStatus: MentorApprovalStatus.Pending } : {}),
        };
        this.store.dispatch(addUser({ user: newUser }));
        sessionStorage.setItem(SESSION_KEY, newUser.id);
        return of(newUser).pipe(delay(600));
      }),
    );
  }

  loadCurrentUser(): Observable<string | null> {
    try {
      const userId = sessionStorage.getItem(SESSION_KEY);
      if (!userId) {
        return of(null);
      }
      return (this.store.select(selectPlatformUsers) as Observable<User[]>).pipe(
        take(1),
        map((users: User[]) => {
          const exists = users.some((u: User) => u.id === userId);
          return exists ? userId : null;
        }),
      );
    } catch {
      return of(null);
    }
  }

  updateProfile(updates: Partial<User>): Observable<User | null> {
    try {
      const userId = sessionStorage.getItem(SESSION_KEY);
      if (!userId) {
        return of(null);
      }
      this.store.dispatch(updateUserProfile({ userId, updates }));
      return (this.store.select(selectPlatformUsers) as Observable<User[]>).pipe(
        take(1),
        map((users: User[]) => {
          const u = users.find((x: User) => x.id === userId);
          return u ? { ...u, ...updates } : null;
        }),
      );
    } catch {
      return of(null);
    }
  }

  markRegistered(updates?: Partial<User>): Observable<User | null> {
    return this.updateProfile({
      registered: true,
      ...updates,
    });
  }

  logout(): Observable<void> {
    sessionStorage.removeItem(SESSION_KEY);
    return of(undefined);
  }

  getPendingMentors(): Observable<User[]> {
    return (this.store.select(selectPlatformUsers) as Observable<User[]>).pipe(
      take(1),
      map((users: User[]) =>
        users.filter((u: User) => u.role === UserRole.Mentor && u.mentorApprovalStatus === MentorApprovalStatus.Pending),
      ),
      delay(300),
    );
  }

  approveMentor(userId: string): Observable<User | null> {
    return (this.store.select(selectPlatformUsers) as Observable<User[]>).pipe(
      take(1),
      switchMap((users: User[]) => {
        const user = users.find((u: User) => u.id === userId);
        if (!user || user.role !== UserRole.Mentor) {
          return of(null).pipe(delay(300));
        }
        this.store.dispatch(
          setMentorApprovalStatus({ userId, mentorApprovalStatus: MentorApprovalStatus.Approved }),
        );
        return (this.store.select(selectPlatformUsers) as Observable<User[]>).pipe(
          take(1),
          map((list: User[]) => list.find((u: User) => u.id === userId) ?? null),
          delay(300),
        );
      }),
    );
  }

  rejectMentor(userId: string): Observable<User | null> {
    return (this.store.select(selectPlatformUsers) as Observable<User[]>).pipe(
      take(1),
      switchMap((users: User[]) => {
        const user = users.find((u: User) => u.id === userId);
        if (!user || user.role !== UserRole.Mentor) {
          return of(null).pipe(delay(300));
        }
        this.store.dispatch(
          setMentorApprovalStatus({ userId, mentorApprovalStatus: MentorApprovalStatus.Rejected }),
        );
        return (this.store.select(selectPlatformUsers) as Observable<User[]>).pipe(
          take(1),
          map((list: User[]) => list.find((u: User) => u.id === userId) ?? null),
          delay(300),
        );
      }),
    );
  }
}
