import { createAction, props } from '@ngrx/store';
import type { MentorStat, PendingMentorshipRequest } from '../../core/models/dashboard.model';

export const loadMentorData = createAction('[Mentor] Load Data', props<{
  stats: MentorStat[];
  pendingRequests: PendingMentorshipRequest[];
  activeMentees: { id: number; name: string; goal: string; progress: number; monthsActive: number }[];
  earnings: { month: string; amount: number; status: string; mentees: number }[];
  myMentees: { id: number; name: string; photoUrl: string; email: string; plan: string; startDate: string; progress: number; status: 'active' | 'pending' | 'completed' }[];
}>());

export const declineMentorshipRequest = createAction('[Mentor] Decline Request', props<{ requestId: number }>());

export const acceptMentorshipRequest = createAction('[Mentor] Accept Request', props<{ request: PendingMentorshipRequest }>());

export const setMentorPendingRequests = createAction('[Mentor] Set Pending Requests', props<{ requests: PendingMentorshipRequest[] }>());

export const removeMenteeFromList = createAction('[Mentor] Remove Mentee', props<{ menteeId: number }>());

export const acceptMenteeRequest = createAction('[Mentor] Accept Mentee', props<{ menteeId: number }>());

export const updateMentorPayoutAccount = createAction(
  '[Mentor] Update Payout Account',
  props<{ payoutAccount: { type: 'bank' | 'instapay'; bankName?: string; accountNumber?: string; instapayNumber?: string } }>(),
);

export const setMentorAcceptingNewMentees = createAction('[Mentor] Set Accepting New Mentees', props<{ accepting: boolean }>());

export const setMentorNotificationSetting = createAction('[Mentor] Set Notification', props<{ id: string; enabled: boolean }>());

export const markMenteeCompleted = createAction('[Mentor] Mark Mentee Completed', props<{ menteeId: number }>());

export const resetMentor = createAction('[Mentor] Reset');
