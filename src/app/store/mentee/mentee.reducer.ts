import { createReducer, on } from '@ngrx/store';
import { cancelMenteeSubscription, loadMenteeData, resetMentee } from './mentee.actions';
import { menteeInitialState, type MenteeState } from './mentee.state';

export const menteeReducer = createReducer<MenteeState>(
  menteeInitialState,
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
