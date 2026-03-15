import type {
  ActiveMentorship,
  MenteeSubscription,
  MenteePayment,
  ActiveMentorSummary,
  PastMentorSummary,
} from '../../core/models/dashboard.model';

export interface MenteeState {
  activeMentorship: ActiveMentorship | null;
  subscription: MenteeSubscription | null;
  payments: MenteePayment[];
  myMentors: {
    active: ActiveMentorSummary[];
    past: PastMentorSummary[];
  };
}

export const menteeInitialState: MenteeState = {
  activeMentorship: null,
  subscription: null,
  payments: [],
  myMentors: { active: [], past: [] },
};
