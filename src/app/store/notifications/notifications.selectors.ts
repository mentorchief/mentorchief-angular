import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { NotificationsState } from './notifications.reducer';

export const selectNotificationsState = createFeatureSelector<NotificationsState>('notifications');

export const selectAllNotifications = createSelector(selectNotificationsState, (s) => s.items);
