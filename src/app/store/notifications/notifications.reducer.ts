import { createReducer, on } from '@ngrx/store';
import type { AppNotification } from '../../core/models/dashboard.model';
import { NotificationsActions } from './notifications.actions';

export interface NotificationsState {
  items: AppNotification[];
}

export const notificationsInitialState: NotificationsState = {
  items: [],
};

export const notificationsReducer = createReducer(
  notificationsInitialState,
  on(NotificationsActions.addNotification, (s, { notification }): NotificationsState => ({
    ...s,
    items: [notification, ...s.items],
  })),
  on(NotificationsActions.markRead, (s, { notificationId }): NotificationsState => ({
    ...s,
    items: s.items.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
  })),
  on(NotificationsActions.markAllRead, (s, { userId }): NotificationsState => ({
    ...s,
    items: s.items.map((n) => (n.userId === userId ? { ...n, read: true } : n)),
  })),
);
