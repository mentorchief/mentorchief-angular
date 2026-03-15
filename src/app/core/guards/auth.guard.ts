import { inject } from '@angular/core';
import { Router, type CanActivateFn, type RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import type { AppState } from '../../store/app.state';
import { selectIsAuthenticated, selectAuthUser } from '../../features/auth/store/auth.selectors';
import { MentorApprovalStatus, UserRole } from '../models/user.model';
import { ROUTES } from '../routes';

export const authGuard: CanActivateFn = (_, state: RouterStateSnapshot) => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }
      return router.createUrlTree([ROUTES.login], {
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
        return router.createUrlTree([ROUTES.signup]);
      }
      if (user.registered) {
        if (user.role === UserRole.Admin) return router.createUrlTree([ROUTES.admin.dashboard]);
        if (user.role === UserRole.Mentor) {
          const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Approved;
          if (status === MentorApprovalStatus.Pending) return router.createUrlTree([ROUTES.mentor.pending]);
          if (status === MentorApprovalStatus.Rejected) return router.createUrlTree([ROUTES.mentor.rejected]);
          return router.createUrlTree([ROUTES.mentor.dashboard]);
        }
        return router.createUrlTree([ROUTES.mentee.dashboard]);
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
      if (user.role === UserRole.Admin) {
        return router.createUrlTree([ROUTES.admin.dashboard]);
      }
      if (user.role === UserRole.Mentor) {
        const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Approved;
        if (status === MentorApprovalStatus.Pending) return router.createUrlTree([ROUTES.mentor.pending]);
        if (status === MentorApprovalStatus.Rejected) return router.createUrlTree([ROUTES.mentor.rejected]);
        return router.createUrlTree([ROUTES.mentor.dashboard]);
      }
      return router.createUrlTree([ROUTES.mentee.dashboard]);
    }),
  );
};

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
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
          return router.createUrlTree([ROUTES.login]);
        }
        if (user.role === UserRole.Admin) {
          return router.createUrlTree([ROUTES.admin.dashboard]);
        }
        if (user.role === UserRole.Mentor) {
          const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Approved;
          if (status === MentorApprovalStatus.Pending) return router.createUrlTree([ROUTES.mentor.pending]);
          if (status === MentorApprovalStatus.Rejected) return router.createUrlTree([ROUTES.mentor.rejected]);
          return router.createUrlTree([ROUTES.mentor.dashboard]);
        }
        return router.createUrlTree([ROUTES.mentee.dashboard]);
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
      if (!user || user.role !== UserRole.Mentor) {
        return true;
      }
      const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Approved;
      if (status === MentorApprovalStatus.Approved) {
        return true;
      }
      if (status === MentorApprovalStatus.Pending) {
        const onPendingPage = state.url === ROUTES.mentor.pending || state.url.startsWith(ROUTES.mentor.pending + '?');
        return onPendingPage ? true : router.createUrlTree([ROUTES.mentor.pending]);
      }
      if (status === MentorApprovalStatus.Rejected) {
        const onRejectedPage = state.url === ROUTES.mentor.rejected || state.url.startsWith(ROUTES.mentor.rejected + '?');
        return onRejectedPage ? true : router.createUrlTree([ROUTES.mentor.rejected]);
      }
      return true;
    }),
  );
};
