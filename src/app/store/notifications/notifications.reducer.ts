import { createReducer, on } from '@ngrx/store';
import { notificationsInitialState } from './notifications.state';
import {
  addNotification,
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  resetNotifications,
} from './notifications.actions';

export const notificationsReducer = createReducer(
  notificationsInitialState,
  on(loadNotifications, (_, { notifications }) => ({
    items: notifications,
    loaded: true,
  })),
  on(addNotification, (state, { notification }) => ({
    ...state,
    items: [notification, ...state.items],
  })),
  on(markNotificationRead, (state, { id }) => ({
    ...state,
    items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
  })),
  on(markAllNotificationsRead, (state) => ({
    ...state,
    items: state.items.map((n) => ({ ...n, read: true })),
  })),
  on(resetNotifications, () => notificationsInitialState),
);
