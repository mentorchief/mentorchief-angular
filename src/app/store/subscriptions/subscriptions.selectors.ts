import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { SubscriptionsState } from './subscriptions.reducer';

export const selectSubscriptionsState = createFeatureSelector<SubscriptionsState>('subscriptions');

export const selectAllSubscriptions = createSelector(selectSubscriptionsState, (s) => s.items);
