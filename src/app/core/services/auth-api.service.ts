import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, switchMap, take } from 'rxjs/operators';
import type { LoginPayload, SignupPayload } from '../models/auth.model';
import type { User } from '../models/user.model';
import type { AppState } from '../../store/app.state';
import { selectPlatformUsers } from '../../features/dashboard/store/dashboard.selectors';
import { addUser, setMentorApprovalStatus, updateUserProfile } from '../../features/dashboard/store/dashboard.actions';

const SESSION_KEY = 'mentorchief_user';

/**
 * Auth API (mock). Reads and updates the single platform user list in the store.
 * No local user array – store is the only source of truth.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly store = inject(Store<AppState>);

  login(payload: LoginPayload): Observable<User> {
    const { email, password } = payload;
    return this.store.select(selectPlatformUsers).pipe(
      take(1),
      delay(600),
      switchMap((users) => {
        const found = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
        );
        if (!found) {
          return throwError(
            () =>
              new Error(
                'Invalid email or password. Try mentee@demo.com or mentor@demo.com with password123.',
              ),
          );
        }
        const user: User = { ...found };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return of(user);
      }),
    );
  }

  signup(payload: SignupPayload): Observable<User> {
    const { name, email, password, role } = payload;
    return this.store.select(selectPlatformUsers).pipe(
      take(1),
      switchMap((users) => {
        const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
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
          ...(role === 'mentor' ? { mentorApprovalStatus: 'pending' as const } : {}),
        };
        this.store.dispatch(addUser({ user: newUser }));
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
        return of(newUser).pipe(delay(600));
      }),
    );
  }

  loadCurrentUser(): Observable<User | null> {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) {
        return of(null);
      }
      const sessionUser = JSON.parse(stored) as User;
      return this.store.select(selectPlatformUsers).pipe(
        take(1),
        map((users) => {
          const fromStore = users.find((u) => u.id === sessionUser.id);
          if (fromStore) {
            const merged = { ...fromStore, ...sessionUser };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(merged));
            return merged;
          }
          return sessionUser;
        }),
      );
    } catch {
      return of(null);
    }
  }

  updateProfile(updates: Partial<User>): Observable<User | null> {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) {
        return of(null);
      }
      const current = JSON.parse(stored) as User;
      this.store.dispatch(updateUserProfile({ userId: current.id, updates }));
      const updated: User = { ...current, ...updates };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return of(updated);
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
    return this.store.select(selectPlatformUsers).pipe(
      take(1),
      map((users) =>
        users.filter((u) => u.role === 'mentor' && u.mentorApprovalStatus === 'pending'),
      ),
      delay(300),
    );
  }

  approveMentor(userId: string): Observable<User | null> {
    return this.store.select(selectPlatformUsers).pipe(
      take(1),
      switchMap((users) => {
        const user = users.find((u) => u.id === userId);
        if (!user || user.role !== 'mentor') {
          return of(null).pipe(delay(300));
        }
        this.store.dispatch(
          setMentorApprovalStatus({ userId, mentorApprovalStatus: 'approved' }),
        );
        try {
          const stored = sessionStorage.getItem(SESSION_KEY);
          if (stored) {
            const current = JSON.parse(stored) as User;
            if (current.id === userId) {
              sessionStorage.setItem(
                SESSION_KEY,
                JSON.stringify({ ...current, mentorApprovalStatus: 'approved' }),
              );
            }
          }
        } catch {
          // ignore
        }
        return this.store.select(selectPlatformUsers).pipe(
          take(1),
          map((list) => list.find((u) => u.id === userId) ?? null),
          delay(300),
        );
      }),
    );
  }

  rejectMentor(userId: string): Observable<User | null> {
    return this.store.select(selectPlatformUsers).pipe(
      take(1),
      switchMap((users) => {
        const user = users.find((u) => u.id === userId);
        if (!user || user.role !== 'mentor') {
          return of(null).pipe(delay(300));
        }
        this.store.dispatch(
          setMentorApprovalStatus({ userId, mentorApprovalStatus: 'rejected' }),
        );
        try {
          const stored = sessionStorage.getItem(SESSION_KEY);
          if (stored) {
            const current = JSON.parse(stored) as User;
            if (current.id === userId) {
              sessionStorage.setItem(
                SESSION_KEY,
                JSON.stringify({ ...current, mentorApprovalStatus: 'rejected' }),
              );
            }
          }
        } catch {
          // ignore
        }
        return this.store.select(selectPlatformUsers).pipe(
          take(1),
          map((list) => list.find((u) => u.id === userId) ?? null),
          delay(300),
        );
      }),
    );
  }
}
