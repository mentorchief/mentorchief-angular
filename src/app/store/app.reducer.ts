import { ActionReducerMap } from '@ngrx/store';
import type { AppState } from './app.state';
import { authReducer } from '../features/auth/store/auth.reducer';
import { registrationReducer } from '../features/registration/store/registration.reducer';
import { usersReducer } from './users/users.reducer';
import { platformReducer } from './platform/platform.reducer';
import { mentorReducer } from './mentor/mentor.reducer';
import { menteeReducer } from './mentee/mentee.reducer';
import { messagingReducer } from './messaging/messaging.reducer';
import { reportsReducer } from './reports/reports.reducer';
import { adminReducer } from './admin/admin.reducer';
import { notificationsReducer } from './notifications/notifications.reducer';

export const appReducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  registration: registrationReducer,
  users: usersReducer,
  platform: platformReducer,
  mentor: mentorReducer,
  mentee: menteeReducer,
  messaging: messagingReducer,
  reports: reportsReducer,
  admin: adminReducer,
  notifications: notificationsReducer,
};
