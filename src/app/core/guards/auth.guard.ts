import { inject } from '@angular/core';
import { Router, type CanActivateFn, type RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import type { AppState } from '../../store/app.state';
import { selectIsAuthenticated, selectAuthUser } from '../../features/auth/store/auth.selectors';

const MENTOR_PENDING_PATH = '/dashboard/mentor/pending';
const MENTOR_REJECTED_PATH = '/dashboard/mentor/rejected';

export const authGuard: CanActivateFn = (_, state: RouterStateSnapshot) => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};

export const registrationGuard: CanActivateFn = () => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectAuthUser).pipe(
    take(1),
    map((user) => {
      if (!user) {
        return router.createUrlTree(['/signup']);
      }
      if (user.registered) {
        if (user.role === 'admin') return router.createUrlTree(['/dashboard/admin']);
        if (user.role === 'mentor') {
          const status = user.mentorApprovalStatus ?? 'approved';
          if (status === 'pending') return router.createUrlTree([MENTOR_PENDING_PATH]);
          if (status === 'rejected') return router.createUrlTree([MENTOR_REJECTED_PATH]);
          return router.createUrlTree(['/dashboard/mentor']);
        }
        return router.createUrlTree(['/dashboard/mentee']);
      }
      return true;
    }),
  );
};

export const guestGuard: CanActivateFn = () => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectAuthUser).pipe(
    take(1),
    map((user) => {
      if (!user) {
        return true;
      }
      if (user.role === 'admin') {
        return router.createUrlTree(['/dashboard/admin']);
      }
      if (user.role === 'mentor') {
        const status = user.mentorApprovalStatus ?? 'approved';
        if (status === 'pending') return router.createUrlTree([MENTOR_PENDING_PATH]);
        if (status === 'rejected') return router.createUrlTree([MENTOR_REJECTED_PATH]);
        return router.createUrlTree(['/dashboard/mentor']);
      }
      return router.createUrlTree(['/dashboard/mentee']);
    }),
  );
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const store = inject(Store<AppState>);
    const router = inject(Router);

    return store.select(selectAuthUser).pipe(
      take(1),
      map((user) => {
        if (user && allowedRoles.includes(user.role)) {
          return true;
        }
        if (!user) {
          return router.createUrlTree(['/login']);
        }
        if (user.role === 'admin') {
          return router.createUrlTree(['/dashboard/admin']);
        }
        if (user.role === 'mentor') {
          const status = user.mentorApprovalStatus ?? 'approved';
          if (status === 'pending') return router.createUrlTree([MENTOR_PENDING_PATH]);
          if (status === 'rejected') return router.createUrlTree([MENTOR_REJECTED_PATH]);
          return router.createUrlTree(['/dashboard/mentor']);
        }
        return router.createUrlTree(['/dashboard/mentee']);
      }),
    );
  };
};

/** Mentor dashboard: pending/rejected mentors only get their status page; approved get full dashboard. */
export const mentorApprovalGuard: CanActivateFn = (_, state: RouterStateSnapshot) => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectAuthUser).pipe(
    take(1),
    map((user) => {
      if (!user || user.role !== 'mentor') {
        return true;
      }
      const status = user.mentorApprovalStatus ?? 'approved';
      if (status === 'approved') {
        return true;
      }
      if (status === 'pending') {
        const onPendingPage = state.url === MENTOR_PENDING_PATH || state.url.startsWith(MENTOR_PENDING_PATH + '?');
        return onPendingPage ? true : router.createUrlTree([MENTOR_PENDING_PATH]);
      }
      if (status === 'rejected') {
        const onRejectedPage = state.url === MENTOR_REJECTED_PATH || state.url.startsWith(MENTOR_REJECTED_PATH + '?');
        return onRejectedPage ? true : router.createUrlTree([MENTOR_REJECTED_PATH]);
      }
      return true;
    }),
  );
};
