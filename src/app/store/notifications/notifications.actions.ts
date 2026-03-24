import { createAction, props } from '@ngrx/store';
import type { AppNotification } from './notifications.state';

export const loadNotifications = createAction(
  '[Notifications] Load',
  props<{ notifications: AppNotification[] }>(),
);

export const addNotification = createAction(
  '[Notifications] Add',
  props<{ notification: AppNotification }>(),
);

export const markNotificationRead = createAction(
  '[Notifications] Mark Read',
  props<{ id: string }>(),
);

export const markAllNotificationsRead = createAction('[Notifications] Mark All Read');

export const resetNotifications = createAction('[Notifications] Reset');
