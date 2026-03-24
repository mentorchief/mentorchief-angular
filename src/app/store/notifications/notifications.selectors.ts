import { createSelector, createFeatureSelector } from '@ngrx/store';
import type { NotificationsState } from './notifications.state';

export const selectNotificationsState = createFeatureSelector<NotificationsState>('notifications');

export const selectAllNotifications = createSelector(
  selectNotificationsState,
  (state) => state.items,
);

export const selectUnreadNotifications = createSelector(
  selectAllNotifications,
  (items) => items.filter((n) => !n.read),
);

export const selectUnreadCount = createSelector(
  selectUnreadNotifications,
  (items) => items.length,
);
