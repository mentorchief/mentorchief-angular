import type { AuthState } from './auth/auth.reducer';
import type { User } from '../core/models/user.model';
import type { PlatformState } from './platform/platform.reducer';
import type { MentorState } from './mentor/mentor.reducer';
import type { MenteeState } from './mentee/mentee.reducer';
import type { AdminState } from './admin/admin.reducer';
import type { MessagingState } from './messaging/messaging.reducer';
import type { RegistrationState } from '../core/models/registration.model';
import type { ReportsState } from './reports/reports.reducer';
import type { NotificationsState } from './notifications/notifications.reducer';
import type { SubscriptionsState } from './subscriptions/subscriptions.reducer';

export interface AppState {
  auth: AuthState;
  users: User[];
  platform: PlatformState;
  mentor: MentorState;
  mentee: MenteeState;
  admin: AdminState;
  messaging: MessagingState;
  registration: RegistrationState;
  reports: ReportsState;
  notifications: NotificationsState;
  subscriptions: SubscriptionsState;
}
