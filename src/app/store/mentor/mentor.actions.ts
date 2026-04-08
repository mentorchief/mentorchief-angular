import { createActionGroup, props } from '@ngrx/store';
import type { MentorPayoutAccount, PendingMentorshipRequest, MenteeListStatus } from '../../core/models/dashboard.model';

export const MentorActions = createActionGroup({
  source: 'Mentor',
  events: {
    'Add Pending Request': props<{ request: PendingMentorshipRequest }>(),
    'Set Accepting New Mentees': props<{ accepting: boolean }>(),
    'Set Payout Account': props<{ account: MentorPayoutAccount }>(),
    'Accept Request': props<{ requestId: number }>(),
    'Decline Request': props<{ requestId: number }>(),
    'Accept Mentee': props<{ menteeId: number }>(),
    'Remove Mentee': props<{ menteeId: number }>(),
    'Mark Mentee Completed': props<{ menteeId: number }>(),
    'Update Mentee Status': props<{ menteeId: number; status: MenteeListStatus; subscriptionId?: string; amount?: number }>(),
  },
});
