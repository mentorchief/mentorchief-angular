import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, type CanActivateFn, type RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, map, take } from 'rxjs';
import type { AppState } from '../../store/app.state';
import { selectAuthUser, selectActiveRole } from '../../features/auth/store/auth.selectors';
import { MentorApprovalStatus, UserRole } from '../models/user.model';
import { ROUTES } from '../routes';
import { selectMyMentees } from '../../store/mentor';

export const authGuard: CanActivateFn = (_, state: RouterStateSnapshot) => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectAuthUser).pipe(
    take(1),
    map((user) => {
      if (!user) {
        return router.createUrlTree([ROUTES.login], {
          queryParams: { returnUrl: state.url },
        });
      }
      if (user.status === 'suspended') {
        return router.createUrlTree([ROUTES.suspended]);
      }
      // Logged in but not yet registered → force to registration steps
      if (!user.registered) {
        return router.createUrlTree([ROUTES.registration.roleInfo]);
      }
      return true;
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
          const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Pending;
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
      if (user.status === 'suspended') {
        return router.createUrlTree([ROUTES.suspended]);
      }
      if (user.role === UserRole.Admin) {
        return router.createUrlTree([ROUTES.admin.dashboard]);
      }
      if (user.role === UserRole.Mentor) {
        const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Pending;
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

    return combineLatest([
      store.select(selectAuthUser),
      store.select(selectActiveRole),
    ]).pipe(
      take(1),
      map(([user, activeRole]) => {
        if (!user) {
          return router.createUrlTree([ROUTES.login]);
        }
        // Real admins always bypass role restrictions
        if (user.role === UserRole.Admin) {
          return true;
        }
        // Fall back to user.role when activeRole not yet set
        const effectiveRole = activeRole ?? user.role;
        if (allowedRoles.includes(effectiveRole)) {
          return true;
        }
        // Redirect to the dashboard matching the effective role
        if (effectiveRole === UserRole.Mentor) {
          const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Pending;
          if (status === MentorApprovalStatus.Pending) return router.createUrlTree([ROUTES.mentor.pending]);
          if (status === MentorApprovalStatus.Rejected) return router.createUrlTree([ROUTES.mentor.rejected]);
          return router.createUrlTree([ROUTES.mentor.dashboard]);
        }
        return router.createUrlTree([ROUTES.mentee.dashboard]);
      }),
    );
  };
};

/**
 * Mentor approval guard factory.
 * Pass the statuses that are ALLOWED on this route block.
 * - Full dashboard routes → mentorApprovalGuard([MentorApprovalStatus.Approved])
 * - Status pages (pending/rejected) → mentorApprovalGuard([MentorApprovalStatus.Pending, MentorApprovalStatus.Rejected])
 */
/** Used as the '' child of the status-pages block to redirect to the correct status page. */
export const mentorStatusRootGuard: CanActivateFn = () => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectAuthUser).pipe(
    take(1),
    map((user) => {
      if (!user || user.role === UserRole.Admin) {
        return router.createUrlTree([ROUTES.mentor.dashboard]);
      }
      const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Pending;
      if (status === MentorApprovalStatus.Approved) {
        return router.createUrlTree([ROUTES.mentor.dashboard]);
      }
      if (status === MentorApprovalStatus.Rejected) {
        return router.createUrlTree([ROUTES.mentor.rejected]);
      }
      return router.createUrlTree([ROUTES.mentor.pending]);
    }),
  );
};

/**
 * Guard for the mentee-reports page.
 * Allows access only if the current mentor has a mentorship (any status) with the mentee UUID in the route params.
 * Redirects to the mentor dashboard otherwise.
 */
export const menteeReportsGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  const menteeUuid = route.paramMap.get('menteeUuid') ?? '';

  return combineLatest([
    store.select(selectAuthUser),
    store.select(selectMyMentees),
  ]).pipe(
    take(1),
    map(([user, mentees]) => {
      if (!user || user.role !== UserRole.Mentor) {
        return router.createUrlTree([ROUTES.mentor.dashboard]);
      }
      const hasMentorship = mentees.some((m) => m.menteeUuid === menteeUuid);
      if (hasMentorship) return true;
      return router.createUrlTree([ROUTES.mentor.dashboard]);
    }),
  );
};

export const mentorApprovalGuard = (
  allowedStatuses: MentorApprovalStatus[] = [MentorApprovalStatus.Approved],
): CanActivateFn => {
  return () => {
    const store = inject(Store<AppState>);
    const router = inject(Router);

    return combineLatest([
      store.select(selectAuthUser),
      store.select(selectActiveRole),
    ]).pipe(
      take(1),
      map(([user, activeRole]) => {
        const effectiveRole = activeRole ?? user?.role;
        // Only applies to real mentors (not admins viewing as mentor)
        if (!user || user.role === UserRole.Admin || effectiveRole !== UserRole.Mentor) {
          return true;
        }
        const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Pending;
        if (allowedStatuses.includes(status)) {
          return true;
        }
        // Redirect to the page matching the mentor's actual status
        if (status === MentorApprovalStatus.Pending) {
          return router.createUrlTree([ROUTES.mentor.pending]);
        }
        if (status === MentorApprovalStatus.Rejected) {
          return router.createUrlTree([ROUTES.mentor.rejected]);
        }
        return router.createUrlTree([ROUTES.mentor.dashboard]);
      }),
    );
  };
};
