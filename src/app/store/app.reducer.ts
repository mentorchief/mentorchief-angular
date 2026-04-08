import { ActionReducerMap } from '@ngrx/store';
import type { AppState } from './app.state';
import { authReducer } from './auth/auth.reducer';
import { usersReducer } from './users/users.reducer';
import { platformReducer } from './platform/platform.reducer';
import { mentorReducer } from './mentor/mentor.reducer';
import { menteeReducer } from './mentee/mentee.reducer';
import { adminReducer } from './admin/admin.reducer';
import { messagingReducer } from './messaging/messaging.reducer';
import { registrationReducer } from './registration/registration.reducer';
import { reportsReducer } from './reports/reports.reducer';
import { notificationsReducer } from './notifications/notifications.reducer';
import { subscriptionsReducer } from './subscriptions/subscriptions.reducer';

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  users: usersReducer,
  platform: platformReducer,
  mentor: mentorReducer,
  mentee: menteeReducer,
  admin: adminReducer,
  messaging: messagingReducer,
  registration: registrationReducer,
  reports: reportsReducer,
  notifications: notificationsReducer,
  subscriptions: subscriptionsReducer,
};
