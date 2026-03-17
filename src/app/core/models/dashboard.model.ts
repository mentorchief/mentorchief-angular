import type { ChatConversation } from './chat.model';
import type { User } from './user.model';

/** Mentee dashboard */

export interface ActiveMentorship {
  mentorId: string;
  mentorName: string;
  mentorTitle: string;
  mentorCompany: string;
  mentorPhotoUrl: string;
  monthsActive: number;
  progress: number;
}

export interface MenteeSubscription {
  planName: string;
  amount: number;
  currency: string;
  /** End of current period (display as "Valid until"). Subscriptions do not auto-renew; user must renew manually. */
  nextBillingDate: string;
  status: 'active' | 'cancelled' | 'past_due';
  /** Subscription start date (YYYY-MM-DD). Used for 3-day full-refund cancellation. */
  startedAt?: string;
}

export interface MenteePayment {
  id: string;
  month: string;
  amount: number;
  status: 'in_escrow' | 'released' | 'refunded';
  releaseDate?: string;
  paidToMentor?: boolean;
}

export interface MenteeDashboardState {
  activeMentorship: ActiveMentorship | null;
  subscription: MenteeSubscription | null;
  payments: MenteePayment[];
}

/** Mentor dashboard */

/** Domain data only. Icon/colors from display.constants. */
export interface MentorStat {
  label: string;
  value: string;
}

export interface PendingMentorshipRequest {
  id: number;
  name: string;
  goal: string;
  message: string;
  rating: number | null;
}

export interface ActiveMenteeSummary {
  id: number;
  name: string;
  goal: string;
  progress: number;
  monthsActive: number;
}

export interface MentorEarning {
  month: string;
  amount: number;
  status: string;
  mentees: number;
}

export interface MentorPayoutAccount {
  type: 'bank' | 'instapay';
  bankName?: string;
  accountNumber?: string;
  instapayNumber?: string;
}

export interface MentorNotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface MentorDashboardState {
  stats: MentorStat[];
  pendingRequests: PendingMentorshipRequest[];
  activeMentees: ActiveMenteeSummary[];
  earnings: MentorEarning[];
  payoutAccount: MentorPayoutAccount;
  acceptingNewMentees: boolean;
  notificationSettings: MentorNotificationSetting[];
}

/** Admin dashboard */

/** Domain data only. Icon/color from display.constants. */
export interface AdminStat {
  label: string;
  value: string;
  change: string;
}

export interface PendingAction {
  title: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
  path: string;
}

export interface RecentActivity {
  type: string;
  name: string;
  detail: string;
  time: string;
}

export interface AdminDashboardState {
  stats: AdminStat[];
  pendingActions: PendingAction[];
  recentActivities: RecentActivity[];
}

/** Admin reports page */

export interface ReportMetric {
  label: string;
  value: string;
  trend: number;
}

export interface RevenueBar {
  month: string;
  value: number;
}

/** Domain data only. Color from display.constants. */
export interface UserGrowthBar {
  label: string;
  count: number;
}

export interface TopMentorRow {
  name: string;
  mentees: number;
  earnings: number;
}

/** Domain data only. Icon/iconBg from display.constants. */
export interface ReportActivityItem {
  id: number;
  text: string;
  time: string;
}

export interface AdminReportsState {
  metrics: ReportMetric[];
  revenueData: RevenueBar[];
  userGrowth: UserGrowthBar[];
  topMentors: TopMentorRow[];
  recentActivity: ReportActivityItem[];
}

/** My Mentors (mentee) – active and past mentorships */

export interface ActiveMentorSummary {
  id: number;
  name: string;
  title: string;
  company: string;
  photoUrl: string;
  startDate: string;
  price: number;
  progress: number;
}

export interface PastMentorSummary {
  id: number;
  name: string;
  title: string;
  photoUrl: string;
  startDate: string;
  endDate: string;
}

/** Mentee review for a mentor (after subscription completed) */

export interface MentorReview {
  mentorId: string;
  rating: number;
  comment: string;
  submittedAt: string;
}

/** Public profile review displayed on mentor profile / reviews page (store-backed) */

export interface MentorProfileReview {
  mentorId: string;
  name: string;
  rating: number;
  text: string;
}

/** Mentor-written report about a mentee at the end of a subscription */

export interface MenteeReport {
  id: number;
  menteeId: string;
  mentorId: string;
  mentorName: string;
  createdAt: string;
  summary: string;
  /** Overall rating 1–5 */
  rating?: number;
  /** Behaviour and professionalism assessment */
  behaviour?: string;
  /** Key strengths */
  strengths?: string[];
  /** Weakness points */
  weaknesses?: string[];
  /** Areas that need development */
  areasToDevelop?: string[];
  /** Recommendations for next steps or future mentors */
  recommendations?: string;
}

/** My Mentees (mentor) */

export interface MenteeListItem {
  id: number;
  name: string;
  photoUrl: string;
  email: string;
  plan: string;
  startDate: string;
  progress: number;
  status: 'active' | 'pending' | 'completed';
}

/** Admin payments list (admin dashboard) */

export interface AdminPayment {
  id: string;
  date: string;
  mentee: string;
  mentor: string;
  amount: number;
  status: 'completed' | 'in_escrow' | 'disputed' | 'refunded';
}

/** Combined dashboard state */

export interface DashboardState {
  mentee: MenteeDashboardState;
  mentor: MentorDashboardState;
  admin: AdminDashboardState;
  adminReports: AdminReportsState;
  /** Single source of truth for all platform users (auth + admin list). */
  platformUsers: User[];
  /** Admin: platform payments/transactions */
  adminPayments: AdminPayment[];
  /** Mentee: list of active and past mentors from "My Mentors" page */
  myMentors: {
    active: ActiveMentorSummary[];
    past: PastMentorSummary[];
  };
  /** Mentor: list of mentees for "My Mentees" page */
  myMentees: MenteeListItem[];
  /** Reviews submitted by the mentee for past mentors */
  menteeReviews: MentorReview[];
  /** Reports written by mentors about mentees */
  menteeReports: MenteeReport[];
  /** Public reviews shown on mentor profile and reviews page, keyed by mentor id */
  mentorProfileReviews: MentorProfileReview[];
  /** Platform config for marketing/public pages (sample price, satisfaction, etc.). */
  platformConfig: { samplePrice: number; satisfactionRate: number; countries: number; defaultCardExpiry?: string; avgSessionRating?: string };
  /** All platform conversations (mentor-mentee chats). Managed by NgRx. */
  conversations: ChatConversation[];
  /** Currently selected conversation id (for messages UI). */
  selectedConversationId: string | null;
  /** Unread message count per conversation for mentor (key = conversationId). */
  mentorUnreadByConversation: Record<string, number>;
}
