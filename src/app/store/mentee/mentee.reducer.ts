import { createReducer, on } from '@ngrx/store';
import type {
  ActiveMentorship,
  MenteeSubscription,
  MenteePayment,
  ActiveMentorSummary,
  PastMentorSummary,
} from '../../core/models/dashboard.model';
import { MENTEE_SEED } from '../../core/data/mentee.seed';
import { MenteeActions } from './mentee.actions';

export interface MenteeState {
  activeMentorship: ActiveMentorship | null;
  subscription: MenteeSubscription | null;
  payments: MenteePayment[];
  myMentors: { active: ActiveMentorSummary[]; past: PastMentorSummary[] };
}

export const menteeInitialState: MenteeState = {
  activeMentorship: MENTEE_SEED.activeMentorship,
  subscription: MENTEE_SEED.subscription,
  payments: MENTEE_SEED.payments,
  myMentors: MENTEE_SEED.myMentors,
};

export const menteeReducer = createReducer(
  menteeInitialState,
  on(MenteeActions.cancelSubscription, (s): MenteeState => ({
    ...s,
    subscription: null,
    activeMentorship: null,
  })),
);
