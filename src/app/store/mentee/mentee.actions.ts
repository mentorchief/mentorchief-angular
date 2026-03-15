import { createAction, props } from '@ngrx/store';
import type {
  ActiveMentorship,
  MenteeSubscription,
  MenteePayment,
  ActiveMentorSummary,
  PastMentorSummary,
} from '../../core/models/dashboard.model';

export const loadMenteeData = createAction('[Mentee] Load Data', props<{
  activeMentorship: ActiveMentorship | null;
  subscription: MenteeSubscription | null;
  payments: MenteePayment[];
  myMentors: { active: ActiveMentorSummary[]; past: PastMentorSummary[] };
}>());

export const cancelMenteeSubscription = createAction('[Mentee] Cancel Subscription');

export const resetMentee = createAction('[Mentee] Reset');
