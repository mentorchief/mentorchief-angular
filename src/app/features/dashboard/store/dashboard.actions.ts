import { createAction, props } from '@ngrx/store';
import type { PendingMentorshipRequest } from '../../../core/models/dashboard.model';
import type { User } from '../../../core/models/user.model';
import type { UserRole } from '../../../core/models/user.model';

/** Initialize dashboard with only data for the given role. Clears other role data from store. */
export const initializeDashboardForRole = createAction(
  '[Dashboard] Initialize For Role',
  props<{ role: UserRole }>(),
);

/** Reset dashboard to full state (e.g. on logout) so platformUsers is available for next login. */
export const resetDashboard = createAction('[Dashboard] Reset');

export const declineMentorshipRequest = createAction(
  '[Dashboard] Decline Mentorship Request',
  props<{ requestId: number }>(),
);

export const acceptMentorshipRequest = createAction(
  '[Dashboard] Accept Mentorship Request',
  props<{ request: PendingMentorshipRequest }>(),
);

export const setMentorPendingRequests = createAction(
  '[Dashboard] Set Mentor Pending Requests',
  props<{ requests: PendingMentorshipRequest[] }>(),
);

export const removeMenteeFromList = createAction(
  '[Dashboard] Remove Mentee From List',
  props<{ menteeId: number }>(),
);

export const acceptMenteeRequest = createAction(
  '[Dashboard] Accept Mentee Request',
  props<{ menteeId: number }>(),
);

export const submitMentorReview = createAction(
  '[Dashboard] Submit Mentor Review',
  props<{ mentorId: number; rating: number; comment: string }>(),
);

export const addMenteeReport = createAction(
  '[Dashboard] Add Mentee Report',
  props<{
    menteeId: number;
    mentorId: number;
    mentorName: string;
    summary: string;
    rating?: number;
    behaviour?: string;
    strengths?: string[];
    weaknesses?: string[];
    areasToDevelop?: string[];
    recommendations?: string;
  }>(),
);

/** Mentee cancels subscription within 3 days for full refund. Mentor must be informed (e.g. via notifications when implemented). */
export const cancelMenteeSubscription = createAction('[Dashboard] Cancel Mentee Subscription');

/** Platform users: single source for auth + admin. */
export const addUser = createAction('[Dashboard] Add User', props<{ user: User }>());

export const updateUserStatus = createAction(
  '[Dashboard] Update User Status',
  props<{ userId: string; status: 'active' | 'suspended' }>(),
);

export const setMentorApprovalStatus = createAction(
  '[Dashboard] Set Mentor Approval Status',
  props<{ userId: string; mentorApprovalStatus: 'pending' | 'approved' | 'rejected' }>(),
);

export const updateUserProfile = createAction(
  '[Dashboard] Update User Profile',
  props<{ userId: string; updates: Partial<User> }>(),
);
