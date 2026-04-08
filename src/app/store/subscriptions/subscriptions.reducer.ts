import { createReducer, on } from '@ngrx/store';
import type { MentorshipSubscription } from '../../core/models/dashboard.model';
import { SubscriptionsActions } from './subscriptions.actions';
import { INITIAL_SUBSCRIPTIONS } from '../../core/data/subscriptions.seed';

export interface SubscriptionsState {
  items: MentorshipSubscription[];
}

export const subscriptionsInitialState: SubscriptionsState = {
  items: [...INITIAL_SUBSCRIPTIONS],
};

export const subscriptionsReducer = createReducer(
  subscriptionsInitialState,
  on(SubscriptionsActions.addSubscription, (s, { subscription }): SubscriptionsState => ({
    ...s,
    items: [...s.items, subscription],
  })),
  on(SubscriptionsActions.confirmPayment, (s, { subscriptionId, transferRef }): SubscriptionsState => ({
    ...s,
    items: s.items.map((sub) =>
      sub.id === subscriptionId
        ? { ...sub, status: 'payment_submitted' as const, linkUsed: true, paymentConfirmedAt: new Date().toISOString(), transferRef: transferRef ?? sub.transferRef }
        : sub,
    ),
  })),
  on(SubscriptionsActions.activateSubscription, (s, { subscriptionId }): SubscriptionsState => ({
    ...s,
    items: s.items.map((sub) =>
      sub.id === subscriptionId
        ? { ...sub, status: 'active' as const, activatedAt: new Date().toISOString() }
        : sub,
    ),
  })),
  on(SubscriptionsActions.rejectPayment, (s, { subscriptionId }): SubscriptionsState => ({
    ...s,
    items: s.items.map((sub) =>
      sub.id === subscriptionId
        ? { ...sub, status: 'approved_awaiting_payment' as const, linkUsed: false, paymentConfirmedAt: undefined, transferRef: undefined }
        : sub,
    ),
  })),
  on(SubscriptionsActions.submitReport, (s, { subscriptionId }): SubscriptionsState => ({
    ...s,
    items: s.items.map((sub) => {
      if (sub.id !== subscriptionId) return sub;
      // Guard: reports can only be submitted for active subscriptions.
      return sub.status === 'active' ? { ...sub, status: 'report_submitted' as const } : sub;
    }),
  })),
  on(SubscriptionsActions.approveReport, (s, { subscriptionId }): SubscriptionsState => ({
    ...s,
    items: s.items.map((sub) => {
      if (sub.id !== subscriptionId) return sub;
      // Guard: admin approval applies only after report submission.
      return sub.status === 'report_submitted' ? { ...sub, status: 'admin_approved' as const } : sub;
    }),
  })),
  on(SubscriptionsActions.completeSubscription, (s, { subscriptionId }): SubscriptionsState => ({
    ...s,
    items: s.items.map((sub) => {
      if (sub.id !== subscriptionId) return sub;
      // Guard: completion only after admin approval.
      return sub.status === 'admin_approved' ? { ...sub, status: 'completed' as const } : sub;
    }),
  })),
  on(SubscriptionsActions.cancelSubscription, (s, { subscriptionId }): SubscriptionsState => ({
    ...s,
    items: s.items.map((sub) => {
      if (sub.id !== subscriptionId) return sub;
      if (sub.status === 'completed') return sub;
      return { ...sub, status: 'cancelled' as const };
    }),
  })),
);
