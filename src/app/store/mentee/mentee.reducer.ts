import { createReducer, on } from '@ngrx/store';
import { cancelMenteeSubscription, loadMenteeData, resetMentee } from './mentee.actions';
import { menteeInitialState, type MenteeState } from './mentee.state';

const initialMenteeData = {
  activeMentorship: {
    mentorId: '1',
    mentorName: 'Sarah Chen',
    mentorTitle: 'Senior PM',
    mentorCompany: 'Google',
    mentorImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
    monthsActive: 2,
    progress: 50,
  },
  subscription: {
    planName: 'Monthly Subscription',
    amount: 150,
    currency: 'USD',
    nextBillingDate: 'April 1, 2026',
    status: 'active' as const,
    startedAt: '2026-03-10',
  },
  payments: [
    { id: '1', month: 'March 2026', amount: 150, status: 'in_escrow' as const, releaseDate: 'Apr 1, 2026', paidToMentor: false },
    { id: '2', month: 'February 2026', amount: 150, status: 'released' as const, paidToMentor: true },
  ],
  myMentors: {
    active: [
      { id: 1, name: 'Sarah Chen', title: 'Senior PM', company: 'Google', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', startDate: 'Feb 1, 2026', price: 150, progress: 65 },
    ],
    past: [
      { id: 2, name: 'David Lee', title: 'Lead PM', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', startDate: 'Jun 1, 2025', endDate: 'Dec 15, 2025' },
    ],
  },
};

export const menteeReducer = createReducer<MenteeState>(
  { ...menteeInitialState, ...initialMenteeData },
  on(loadMenteeData, (_, payload) => ({ ...menteeInitialState, ...payload })),
  on(resetMentee, () => menteeInitialState),
  on(cancelMenteeSubscription, (state) => {
    const sub = state.subscription;
    if (!sub || sub.status !== 'active') return state;
    return {
      ...state,
      activeMentorship: null,
      subscription: { ...sub, status: 'cancelled' as const },
      payments: state.payments.map((p) =>
        p.status === 'in_escrow' ? { ...p, status: 'refunded' as const, paidToMentor: false } : p,
      ),
    };
  }),
);
