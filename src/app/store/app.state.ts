import type { AuthState } from '../core/models/auth.model';
import type { RegistrationState } from '../core/models/registration.model';
import type { UsersState } from './users/users.state';
import type { PlatformState } from './platform/platform.state';
import type { MentorState } from './mentor/mentor.state';
import type { MenteeState } from './mentee/mentee.state';
import type { MessagingState } from './messaging/messaging.state';
import type { ReportsState } from './reports/reports.state';
import type { AdminState } from './admin/admin.state';
import type { NotificationsState } from './notifications/notifications.state';

/**
 * DATA FLOW — Entity Ownership
 * ───────────────────────────
 * auth:     userId only; selectAuthUser → users slice
 * users:    OWNS all User entities (EntityAdapter)
 * platform: OWNS platformConfig
 * mentor:   OWNS mentor stats, mentees, earnings
 * mentee:   OWNS mentee mentorship, subscription, payments
 * messaging: OWNS ChatConversationCore (no names); names joined from users at selector
 * reports:  OWNS reviews, reports
 * admin:    OWNS admin stats, payments
 */
export interface AppState {
  auth: AuthState;
  registration: RegistrationState;
  users: UsersState;
  platform: PlatformState;
  mentor: MentorState;
  mentee: MenteeState;
  messaging: MessagingState;
  reports: ReportsState;
  admin: AdminState;
  notifications: NotificationsState;
}
