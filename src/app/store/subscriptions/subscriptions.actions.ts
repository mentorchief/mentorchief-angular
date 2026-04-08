import { createActionGroup, props } from '@ngrx/store';
import type { MentorshipSubscription } from '../../core/models/dashboard.model';

export const SubscriptionsActions = createActionGroup({
  source: 'Subscriptions',
  events: {
    'Add Subscription': props<{ subscription: MentorshipSubscription }>(),
    'Confirm Payment': props<{ subscriptionId: string; transferRef?: string }>(),
    'Activate Subscription': props<{ subscriptionId: string }>(),
    'Reject Payment': props<{ subscriptionId: string }>(),
    'Submit Report': props<{ subscriptionId: string }>(),
    'Approve Report': props<{ subscriptionId: string }>(),
    'Complete Subscription': props<{ subscriptionId: string }>(),
    'Cancel Subscription': props<{ subscriptionId: string }>(),
  },
});
