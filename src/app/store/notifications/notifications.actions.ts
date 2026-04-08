import { createActionGroup, props } from '@ngrx/store';
import type { AppNotification } from '../../core/models/dashboard.model';

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    'Add Notification': props<{ notification: AppNotification }>(),
    'Mark Read': props<{ notificationId: string }>(),
    'Mark All Read': props<{ userId: string }>(),
  },
});
