import { createSelector } from '@ngrx/store';
import type { ChatConversation, ConversationListItem } from '../../../core/models/chat.model';
import type {
  PastMentorSummary,
  PendingMentorshipRequest,
  MentorReview,
  MenteeReport,
  MenteePayment,
  MentorEarning,
  AdminStat,
  MentorStat,
  PendingAction,
  RecentActivity,
  ReportMetric,
  UserGrowthBar,
} from '../../../core/models/dashboard.model';
import { DEFAULT_AVG_RATING } from '../../../core/constants';
import { ADMIN_STAT_DISPLAY, MENTOR_STAT_DISPLAY, REPORT_ACTIVITY_DISPLAY, USER_GROWTH_COLORS } from '../../../core/constants/display.constants';
import { MentorApprovalStatus, ROLE_DISPLAY_LABELS, UserRole, type User } from '../../../core/models/user.model';
import { ROUTES } from '../../../core/routes';
import { selectAuthUser } from '../../auth/store/auth.selectors';

import { selectActiveMentorship, selectActiveMentorsList, selectMenteePayments, selectMenteeSubscription, selectMyMentors, selectPastMentorsList } from '../../../store/mentee';
import {
  selectMentorAcceptingNewMentees,
  selectMentorActiveMentees,
  selectMentorEarnings,
  selectMentorNotificationSettings,
  selectMentorPayoutAccount,
  selectMentorPendingRequests,
  selectMyMentees,
} from '../../../store/mentor';
import { selectAdminPayments, selectAdminReports, selectAdminStats, selectAdminPendingActions, selectAdminRecentActivities } from '../../../store/admin';
import { selectPlatformUsers } from '../../../store/users';
import { selectPlatformConfig } from '../../../store/platform';
import { selectMenteeReports, selectMenteeReviews, selectMentorProfileReviews } from '../../../store/reports';
import {
  selectAllConversations,
  selectMentorUnreadByConversation,
  selectSelectedConversation,
  selectSelectedConversationId,
} from '../../../store/messaging';

export const selectMenteeDashboard = createSelector(
  selectActiveMentorship,
  selectMenteeSubscription,
  selectMenteePayments,
  (activeMentorship, subscription, payments) => ({ activeMentorship, subscription, payments }),
);

export const selectMentorDashboard = createSelector(
  selectMentorPendingRequests,
  selectMentorActiveMentees,
  selectMentorEarnings,
  selectMentorPayoutAccount,
  selectMentorAcceptingNewMentees,
  selectMentorNotificationSettings,
  selectMyMentees,
  (pendingRequests, activeMentees, earnings, payoutAccount, acceptingNewMentees, notificationSettings, myMentees) => ({
    stats: [],
    pendingRequests,
    activeMentees,
    earnings,
    payoutAccount,
    acceptingNewMentees,
    notificationSettings,
    myMentees,
  }),
);

export const selectAdminDashboard = createSelector(
  selectAdminStats,
  selectAdminPendingActions,
  selectAdminRecentActivities,
  (stats, pendingActions, recentActivities) => ({ stats, pendingActions, recentActivities }),
);

export { selectMyMentors, selectMyMentees, selectActiveMentorship, selectMenteeSubscription, selectMenteePayments };

/** Mentee payments as display rows (mentor name from activeMentorship; status 'released' → 'completed'). */
export const selectMenteePaymentsForDisplay = createSelector(
  selectMenteePayments,
  selectActiveMentorship,
  (payments: MenteePayment[], mentorship) => {
    const mentorName = mentorship?.mentorName ?? ROLE_DISPLAY_LABELS[UserRole.Mentor];
    return payments.map((p) => ({
      id: p.id,
      date: p.releaseDate ?? p.month,
      mentor: mentorName,
      amount: p.amount,
      status: (p.status === 'released' ? 'completed' : p.status) as 'completed' | 'in_escrow' | 'refunded',
      period: p.month,
    }));
  },
);

/** True when mentee can cancel subscription within 3 days for full refund. */
export const selectCanCancelSubscriptionForRefund = createSelector(selectMenteeSubscription, (sub) => {
  if (!sub || sub.status !== 'active' || !sub.startedAt) return false;
  const start = new Date(sub.startedAt);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return daysSinceStart >= 0 && daysSinceStart <= 3;
});

export {
  selectMentorPendingRequests,
  selectMentorActiveMentees,
  selectMentorEarnings,
  selectMentorPayoutAccount,
  selectMentorAcceptingNewMentees,
  selectMentorNotificationSettings,
};

export const selectMentorStats = createSelector(selectMentorDashboard, (d) => d.stats);

/** Mentor stats derived from store (domain only). */
const selectMentorStatsDomain = createSelector(
  selectMyMentees,
  selectMentorEarnings,
  selectMenteeReviews,
  selectPlatformConfig,
  (mentees, earnings, reviews, config): MentorStat[] => {
    const active = mentees.filter((m) => m.status === 'active').length;
    const monthly = earnings[0]?.amount ?? 0;
    const totalEarned = earnings.reduce((sum, e) => sum + e.amount, 0);
    const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : (config?.avgSessionRating ?? DEFAULT_AVG_RATING);
    return [
      { label: 'Active Mentees', value: String(active) },
      { label: 'Monthly Revenue', value: `$${monthly.toLocaleString()}` },
      { label: 'Total Earned', value: `$${totalEarned.toLocaleString()}` },
      { label: 'Avg. Rating', value: String(avgRating) },
    ];
  },
);

/** Mentor stats with display (icon, colors) from constants. */
export const selectMentorStatsComputed = createSelector(selectMentorStatsDomain, (stats) =>
  stats.map((s) => {
    const display = MENTOR_STAT_DISPLAY[s.label];
    return { ...s, icon: display?.icon ?? ['fas', 'circle'], bgColor: display?.bgColor ?? 'bg-gray-100', textColor: display?.textColor ?? 'text-gray-600' };
  }),
);

/** Mentor earnings as display rows. */
export const selectMentorEarningsForDisplay = createSelector(selectMentorEarnings, (earnings: MentorEarning[]) =>
  earnings.map((e, i) => ({
    id: String(i + 1),
    date: e.month,
    mentee: e.mentees === 1 ? '1 mentee' : `${e.mentees} mentees`,
    amount: e.amount,
    status: (e.status === 'Released' ? 'paid' : e.status === 'In Escrow' ? 'in_escrow' : 'pending') as 'paid' | 'in_escrow' | 'pending',
    period: e.month,
  })),
);

export { selectAdminStats, selectAdminPendingActions, selectPlatformUsers, selectAdminPayments };

/** Derive recent activities from real user + payment data (last 10 events). */
export const selectAdminRecentActivitiesComputed = createSelector(
  selectPlatformUsers,
  selectAdminPayments,
  (users: User[], payments): RecentActivity[] => {
    const events: { date: Date; activity: RecentActivity }[] = [];

    // User registrations & mentor applications
    users.forEach((u) => {
      if (!u.joinDate) return;
      const d = new Date(u.joinDate);
      events.push({
        date: d,
        activity: {
          type: u.role === UserRole.Mentor ? 'Mentor Application' : 'New Registration',
          name: u.name,
          detail: u.role === UserRole.Mentor
            ? `Applied as mentor — ${u.mentorApprovalStatus ?? 'pending'}`
            : `Registered as ${u.role}`,
          time: formatRelativeTime(d),
        },
      });
    });

    // Payments
    payments.forEach((p) => {
      const d = new Date(p.date);
      events.push({
        date: d,
        activity: {
          type: p.status === 'refunded' ? 'Refund' : 'Payment',
          name: `${p.mentee} → ${p.mentor}`,
          detail: `$${p.amount} — ${p.status}`,
          time: formatRelativeTime(d),
        },
      });
    });

    // Sort newest first and take 10
    events.sort((a, b) => b.date.getTime() - a.date.getTime());
    return events.slice(0, 10).map((e) => e.activity);
  },
);

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Admin stats derived from store (domain only). */
const selectAdminStatsDomain = createSelector(
  selectPlatformUsers,
  selectAdminPayments,
  (users: User[], payments): AdminStat[] => {
    const total = users.length;
    const mentors = users.filter((u: User) => u.role === UserRole.Mentor && u.mentorApprovalStatus !== MentorApprovalStatus.Rejected && u.status !== 'suspended').length;
    const mentees = users.filter((u: User) => u.role === UserRole.Mentee && u.status !== 'suspended').length;
    const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const completed = payments.filter((p) => p.status === 'completed').length;
    return [
      { label: 'Total Users', value: String(total), change: '—' },
      { label: 'Active Mentors', value: String(mentors), change: '—' },
      { label: 'Active Mentees', value: String(mentees), change: '—' },
      { label: 'Monthly Revenue', value: `$${revenue.toLocaleString()}`, change: '—' },
      { label: 'Active Sessions', value: String(completed), change: '—' },
      { label: 'Platform Growth', value: `${total} users`, change: '—' },
    ];
  },
);

/** Admin stats with display (icon, color) from constants. */
export const selectAdminStatsComputed = createSelector(selectAdminStatsDomain, (stats) =>
  stats.map((s) => {
    const display = ADMIN_STAT_DISPLAY[s.label];
    return { ...s, icon: display?.icon ?? ['fas', 'circle'], color: display?.color ?? 'text-gray-600' };
  }),
);

/** Pending actions with counts from store. */
export const selectAdminPendingActionsComputed = createSelector(
  selectPlatformUsers,
  selectAdminPayments,
  (users: User[], payments): PendingAction[] => {
    const mentorApplications = users.filter((u: User) => u.role === UserRole.Mentor && u.mentorApprovalStatus === MentorApprovalStatus.Pending).length;
    const reportedIssues = payments.filter((p) => p.status === 'disputed').length;
    return [
      { title: 'Mentor Applications', count: mentorApplications, priority: 'high', path: ROUTES.admin.mentorApplications },
      { title: 'Reported Issues', count: reportedIssues, priority: 'high', path: ROUTES.admin.payments },
      { title: 'Feature Requests', count: 0, priority: 'low', path: ROUTES.admin.settings },
    ];
  },
);

export { selectMenteeReviews, selectPlatformConfig };

export const selectReportMetrics = createSelector(selectAdminReports, (r) => r.metrics);

/** Report metrics derived from store. */
export const selectReportMetricsComputed = createSelector(
  selectPlatformUsers,
  selectAdminPayments,
  selectMenteeReviews,
  selectPlatformConfig,
  (users: User[], payments, reviews, config): ReportMetric[] => {
    const total = users.length;
    const mentors = users.filter((u: User) => u.role === UserRole.Mentor && u.mentorApprovalStatus !== MentorApprovalStatus.Rejected).length;
    const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : (config?.avgSessionRating ?? DEFAULT_AVG_RATING);
    return [
      { label: 'Total Users', value: String(total), trend: 0 },
      { label: 'Active Mentorships', value: String(mentors), trend: 0 },
      { label: 'Monthly Revenue', value: `$${revenue.toLocaleString()}`, trend: 0 },
      { label: 'Avg. Session Rating', value: avgRating, trend: 0 },
    ];
  },
);

export const selectReportRevenueData = createSelector(selectAdminReports, (r) => r.revenueData);
export const selectReportUserGrowth = createSelector(selectAdminReports, (r) => r.userGrowth);

/** User growth bars derived from platformUsers by role (domain only). */
const selectReportUserGrowthDomain = createSelector(
  selectPlatformUsers,
  (users: User[]): UserGrowthBar[] => [
    { label: 'Mentees', count: users.filter((u: User) => u.role === UserRole.Mentee).length },
    { label: 'Mentors', count: users.filter((u: User) => u.role === UserRole.Mentor).length },
    { label: 'Admins', count: users.filter((u: User) => u.role === UserRole.Admin).length },
  ],
);

/** User growth bars with color from constants. */
export const selectReportUserGrowthComputed = createSelector(selectReportUserGrowthDomain, (bars) =>
  bars.map((b) => ({ ...b, color: USER_GROWTH_COLORS[b.label] ?? 'bg-gray-500' })),
);

export const selectReportTopMentors = createSelector(selectAdminReports, (r) => r.topMentors);

/** Recent activity domain (id, text, time). */
const selectReportRecentActivityDomain = createSelector(selectAdminReports, (r) => r.recentActivity);

/** Recent activity with icon/iconBg from constants for display. */
export const selectReportRecentActivity = createSelector(selectReportRecentActivityDomain, (activities) =>
  activities.map((a) => {
    const display = REPORT_ACTIVITY_DISPLAY[a.id];
    return { ...a, icon: display?.icon ?? ['fas', 'circle'], iconBg: display?.iconBg ?? 'bg-gray-100' };
  }),
);
export const selectReportMaxRevenue = createSelector(selectReportRevenueData, (data) =>
  data.length ? Math.max(...data.map((d) => d.value)) : 0,
);
export const selectReportMaxUsers = createSelector(selectReportUserGrowth, (data) =>
  data.length ? Math.max(...data.map((d) => d.count)) : 0,
);
export const selectReportMaxUsersComputed = createSelector(selectReportUserGrowthComputed, (data) =>
  data.length ? Math.max(...data.map((d) => d.count)) : 0,
);
export const selectReportRevenueChart = createSelector(
  selectReportRevenueData,
  selectReportMaxRevenue,
  (data, maxRevenue) => ({ data, maxRevenue }),
);
export const selectReportUserGrowthChart = createSelector(
  selectReportUserGrowth,
  selectReportMaxUsers,
  (data, maxUsers) => ({ data, maxUsers }),
);
export const selectReportUserGrowthChartComputed = createSelector(
  selectReportUserGrowthComputed,
  selectReportMaxUsersComputed,
  (data, maxUsers) => ({ data, maxUsers }),
);

export { selectActiveMentorsList, selectPastMentorsList };
export { selectMenteeReports, selectMentorProfileReviews };

/** Avg rating derived from menteeReviews. */
export const selectAvgSessionRating = createSelector(
  selectMenteeReviews,
  selectPlatformConfig,
  (reviews, config) => {
    if (!reviews.length) return config?.avgSessionRating ?? DEFAULT_AVG_RATING;
    return (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);
  },
);

/** Platform stats for public/marketing pages. */
export const selectPlatformStatsForMarketing = createSelector(selectPlatformUsers, (users: User[]) => {
  const total = users.length;
  const mentors = users.filter((u: User) => u.role === UserRole.Mentor && u.mentorApprovalStatus !== MentorApprovalStatus.Rejected).length;
  const mentees = users.filter((u: User) => u.role === UserRole.Mentee).length;
  return { total, mentors, mentees };
});

/** Platform stats + config for marketing. */
export const selectPlatformMarketingData = createSelector(
  selectPlatformStatsForMarketing,
  selectPlatformConfig,
  (stats, config) => ({
    ...stats,
    satisfactionRate: config.satisfactionRate,
    countries: config.countries,
    samplePrice: config.samplePrice,
  }),
);

/** Review count per mentor id. */
export const selectMentorProfileReviewCountByMentorId = createSelector(selectMentorProfileReviews, (reviews) => {
  const map: Record<string, number> = {};
  for (const r of reviews) {
    map[r.mentorId] = (map[r.mentorId] ?? 0) + 1;
  }
  return map;
});

/** Reports with mentee name resolved. */
export const selectMenteeReportsWithMenteeNames = createSelector(
  selectMenteeReports,
  selectMyMentees,
  selectPlatformUsers,
  (reports, mentees, users) =>
    reports.map((r) => ({
      ...r,
      menteeName: r.menteeName ?? mentees.find((m) => String(m.id) === r.menteeId)?.name ?? users.find((u) => u.id === r.menteeId)?.name ?? `Mentee #${r.menteeId}`,
    })),
);

/** Mentee: only reports for the current user. */
export const selectMenteeReportsForCurrentMentee = createSelector(
  selectAuthUser,
  selectMenteeReports,
  (user, reports) => (user ? reports.filter((r) => user.id === r.menteeId) : []),
);

/** Mentor: only reports written by the current user. */
export const selectMenteeReportsForCurrentMentor = createSelector(
  selectAuthUser,
  selectMenteeReportsWithMenteeNames,
  (user, reports) => (user ? reports.filter((r) => user.id === r.mentorId) : []),
);

/** Unified pending item. */
export interface UnifiedPendingItem {
  id: number;
  /** Supabase mentorships UUID — used for accept/decline API calls */
  mentorshipId?: string;
  /** Supabase UUID of the mentee — used to load their reports */
  menteeUuid?: string;
  name: string;
  goalOrPlan: string;
  detail: string;
  rating: number | null;
  source: 'request' | 'mentee';
  latestReport: (MenteeReport & { menteeName: string }) | null;
}

/** Pending requests with latest report. */
export interface PendingRequestWithReport {
  request: PendingMentorshipRequest;
  latestReport: (MenteeReport & { menteeName: string }) | null;
}

export const selectPendingRequestsWithLatestReport = createSelector(
  selectMentorPendingRequests,
  selectMenteeReportsWithMenteeNames,
  (requests, reports): PendingRequestWithReport[] =>
    requests.map((request) => {
      const menteeReports = reports
        .filter((r) => request.menteeUuid ? r.menteeId === request.menteeUuid : r.menteeName === request.name)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { request, latestReport: menteeReports[0] ?? null };
    }),
);

/** Report by id. */
export const selectReportById = (reportId: number) =>
  createSelector(selectMenteeReportsWithMenteeNames, (reports) =>
    reports.find((r) => r.id === reportId) ?? null,
  );

export const selectPastMentorsWithReviews = createSelector(
  selectPastMentorsList,
  selectMenteeReviews,
  selectMenteeReports,
  (past: PastMentorSummary[], reviews: MentorReview[], reports: MenteeReport[]) =>
    past.map((mentor) => {
      const mentorUuid = mentor.mentorUuid ?? null;
      return {
        ...mentor,
        review: mentorUuid ? reviews.find((r) => r.mentorId === mentorUuid) : undefined,
        report: mentorUuid ? reports.find((r) => r.mentorId === mentorUuid) : undefined,
      };
    }),
);

export const selectMyMenteesPending = createSelector(selectMyMentees, (list) =>
  list.filter((m) => m.status === 'pending'),
);
export const selectMyMenteesActive = createSelector(selectMyMentees, (list) =>
  list.filter((m) => m.status === 'active'),
);

/** Unified pending (dashboard + my-mentees). */
export const selectAllUnifiedPending = createSelector(
  selectPendingRequestsWithLatestReport,
  (pendingWithReports): UnifiedPendingItem[] =>
    pendingWithReports.map((item) => ({
      id: item.request.id,
      mentorshipId: item.request.mentorshipId,
      menteeUuid: item.request.menteeUuid,
      name: item.request.name,
      goalOrPlan: item.request.goal,
      detail: item.request.message,
      rating: item.request.rating,
      source: 'request' as const,
      latestReport: item.latestReport,
    })),
);

/** Chat / conversations */
export const selectConversations = selectAllConversations;
export { selectSelectedConversationId, selectSelectedConversation, selectMentorUnreadByConversation };

/** Mentor: conversations where current user is the mentor. */
export const selectMentorConversations = createSelector(
  selectAuthUser,
  selectAllConversations,
  (user, conversations: ChatConversation[]): ChatConversation[] =>
    user ? conversations.filter((c: ChatConversation) => c.mentorId === user.id) : [],
);

/** Mentee: conversations where current user is the mentee. */
export const selectMenteeConversations = createSelector(
  selectAuthUser,
  selectAllConversations,
  (user, conversations: ChatConversation[]): ChatConversation[] =>
    user ? conversations.filter((c: ChatConversation) => c.menteeId === user.id) : [],
);

/** Admin: all conversations. */
export const selectAdminConversations = selectAllConversations;

/** Mentor list items. */
export const selectMentorConversationListItems = createSelector(
  selectMentorConversations,
  selectMentorUnreadByConversation,
  (conversations, unreadByConv): ConversationListItem[] =>{
    console.log(conversations);
   return conversations.map((c) => ({
      id: c.id,
      name: c.menteeName,
      avatar: '',
      lastMessage: c.lastMessage,
      timestamp: c.lastTimestamp,
      unread: (unreadByConv[c.id] ?? 0) > 0,
      unreadCount: unreadByConv[c.id] ?? 0,
    }))
  }
  );

/** Conversation id for a mentee. */
export const selectConversationIdForMentee = (menteeIdOrName: number | string) =>
  createSelector(selectMentorConversations, (conversations) => {
    const conv = conversations.find(
      (c) => c.menteeId === String(menteeIdOrName) || c.menteeName === menteeIdOrName,
    );
    return conv?.id ?? null;
  });

/** Unread count by mentee id and name. */
export const selectMenteeUnreadCounts = createSelector(
  selectMentorConversations,
  selectMentorUnreadByConversation,
  (conversations, unreadByConv) => {
    const byId: Record<number, number> = {};
    const byName: Record<string, number> = {};
    for (const c of conversations) {
      const count = unreadByConv[c.id] ?? 0;
      byId[Number(c.menteeId)] = count;
      byName[c.menteeName] = count;
    }
    return { byId, byName };
  },
);

/** Mentee list items. */
export const selectMenteeConversationListItems = createSelector(
  selectMenteeConversations,
  (conversations): ConversationListItem[] =>
    conversations.map((c) => ({
      id: c.id,
      name: c.mentorName,
      avatar: '',
      lastMessage: c.lastMessage,
      timestamp: c.lastTimestamp,
      unread: false,
    })),
);
