import { createFeatureSelector, createSelector } from '@ngrx/store';
import type {
  DashboardState,
  PastMentorSummary,
  MentorReview,
  MentorProfileReview,
  MenteeReport,
  MenteePayment,
  MentorEarning,
  AdminStat,
  MentorStat,
  PendingAction,
  ReportMetric,
  UserGrowthBar,
} from '../../../core/models/dashboard.model';
import { DEFAULT_AVG_RATING } from '../../../core/constants';
import { selectAuthUser } from '../../auth/store/auth.selectors';

export const selectDashboardState = createFeatureSelector<DashboardState>('dashboard');

export const selectMenteeDashboard = createSelector(selectDashboardState, (s) => s.mentee);
export const selectMentorDashboard = createSelector(selectDashboardState, (s) => s.mentor);
export const selectAdminDashboard = createSelector(selectDashboardState, (s) => s.admin);
export const selectMyMentors = createSelector(selectDashboardState, (s) => s.myMentors);
export const selectMyMentees = createSelector(selectDashboardState, (s) => s.myMentees);

export const selectActiveMentorship = createSelector(selectMenteeDashboard, (d) => d.activeMentorship);
export const selectMenteeSubscription = createSelector(selectMenteeDashboard, (d) => d.subscription);
export const selectMenteePayments = createSelector(selectMenteeDashboard, (d) => d.payments);

/** Mentee payments as display rows (mentor name from activeMentorship; status 'released' → 'completed'). */
export const selectMenteePaymentsForDisplay = createSelector(
  selectMenteePayments,
  selectActiveMentorship,
  (payments: MenteePayment[], mentorship) => {
    const mentorName = mentorship?.mentorName ?? 'Mentor';
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

/** True when mentee can cancel subscription within 3 days for full refund (mentor will be informed). */
export const selectCanCancelSubscriptionForRefund = createSelector(selectMenteeSubscription, (sub) => {
  if (!sub || sub.status !== 'active' || !sub.startedAt) return false;
  const start = new Date(sub.startedAt);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return daysSinceStart >= 0 && daysSinceStart <= 3;
});

export const selectMentorStats = createSelector(selectMentorDashboard, (d) => d.stats);
export const selectMentorPendingRequests = createSelector(selectMentorDashboard, (d) => d.pendingRequests);
export const selectMentorActiveMentees = createSelector(selectMentorDashboard, (d) => d.activeMentees);
export const selectMentorEarnings = createSelector(selectMentorDashboard, (d) => d.earnings);

/** Mentor stats derived from store (myMentees, earnings, menteeReviews). Use this in UI so numbers reflect store data. */
export const selectMentorStatsComputed = createSelector(
  selectMyMentees,
  selectMentorEarnings,
  selectDashboardState,
  (mentees, earnings, state): MentorStat[] => {
    const active = mentees.filter((m) => m.status === 'active').length;
    const monthly = earnings[0]?.amount ?? 0;
    const totalEarned = earnings.reduce((sum, e) => sum + e.amount, 0);
    const reviews = state.menteeReviews;
    const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : (state.platformConfig?.avgSessionRating ?? DEFAULT_AVG_RATING);
    return [
      { label: 'Active Mentees', value: String(active), icon: ['fas', 'users'], bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
      { label: 'Monthly Revenue', value: `$${monthly.toLocaleString()}`, icon: ['fas', 'dollar-sign'], bgColor: 'bg-green-50', textColor: 'text-green-600' },
      { label: 'Total Earned', value: `$${totalEarned.toLocaleString()}`, icon: ['fas', 'wallet'], bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
      { label: 'Avg. Rating', value: String(avgRating), icon: ['fas', 'star'], bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
    ];
  },
);

/** Mentor earnings as display rows (id, date, mentee label, amount, status, period). */
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

export const selectAdminStats = createSelector(selectAdminDashboard, (d) => d.stats);
export const selectAdminPendingActions = createSelector(selectAdminDashboard, (d) => d.pendingActions);
export const selectAdminRecentActivities = createSelector(selectAdminDashboard, (d) => d.recentActivities);
/** Single source of truth for all platform users (auth + admin). */
export const selectPlatformUsers = createSelector(selectDashboardState, (s) => s.platformUsers);
export const selectAdminPayments = createSelector(selectDashboardState, (s) => s.adminPayments);

/** Admin stats derived from store (platformUsers, adminPayments). Use this in UI so numbers reflect store data. */
export const selectAdminStatsComputed = createSelector(
  selectPlatformUsers,
  selectAdminPayments,
  (users, payments): AdminStat[] => {
    const total = users.length;
    const mentors = users.filter((u) => u.role === 'mentor' && u.mentorApprovalStatus !== 'rejected' && u.status !== 'suspended').length;
    const mentees = users.filter((u) => u.role === 'mentee' && u.status !== 'suspended').length;
    const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const completed = payments.filter((p) => p.status === 'completed').length;
    return [
      { label: 'Total Users', value: String(total), change: '—', icon: ['fas', 'users'], color: 'text-blue-600' },
      { label: 'Active Mentors', value: String(mentors), change: '—', icon: ['fas', 'check'], color: 'text-green-600' },
      { label: 'Active Mentees', value: String(mentees), change: '—', icon: ['fas', 'users'], color: 'text-indigo-600' },
      { label: 'Monthly Revenue', value: `$${revenue.toLocaleString()}`, change: '—', icon: ['fas', 'dollar-sign'], color: 'text-emerald-600' },
      { label: 'Active Sessions', value: String(completed), change: '—', icon: ['fas', 'file-lines'], color: 'text-purple-600' },
      { label: 'Platform Growth', value: `${total} users`, change: '—', icon: ['fas', 'chart-line'], color: 'text-amber-600' },
    ];
  },
);

/** Pending actions with counts from store. */
export const selectAdminPendingActionsComputed = createSelector(
  selectPlatformUsers,
  selectAdminPayments,
  (users, payments): PendingAction[] => {
    const mentorApplications = users.filter((u) => u.role === 'mentor' && u.mentorApprovalStatus === 'pending').length;
    const reportedIssues = payments.filter((p) => p.status === 'disputed').length;
    return [
      { title: 'Mentor Applications', count: mentorApplications, priority: 'high', path: '/dashboard/admin/mentor-applications' },
      { title: 'Reported Issues', count: reportedIssues, priority: 'high', path: '/dashboard/admin/payments' },
      { title: 'Feature Requests', count: 0, priority: 'low', path: '/dashboard/admin/settings' },
    ];
  },
);

export const selectAdminReports = createSelector(selectDashboardState, (s) => s.adminReports);
export const selectReportMetrics = createSelector(selectAdminReports, (r) => r.metrics);
export const selectMenteeReviews = createSelector(selectDashboardState, (s) => s.menteeReviews);
export const selectPlatformConfig = createSelector(selectDashboardState, (s) => s.platformConfig);

/** Report metrics derived from store. */
export const selectReportMetricsComputed = createSelector(
  selectPlatformUsers,
  selectAdminPayments,
  selectMenteeReviews,
  selectPlatformConfig,
  (users, payments, reviews, config): ReportMetric[] => {
    const total = users.length;
    const mentors = users.filter((u) => u.role === 'mentor' && u.mentorApprovalStatus !== 'rejected').length;
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

/** User growth bars derived from platformUsers by role. */
export const selectReportUserGrowthComputed = createSelector(
  selectPlatformUsers,
  (users): UserGrowthBar[] => {
    const mentees = users.filter((u) => u.role === 'mentee').length;
    const mentors = users.filter((u) => u.role === 'mentor').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    return [
      { label: 'Mentees', count: mentees, color: 'bg-blue-500' },
      { label: 'Mentors', count: mentors, color: 'bg-purple-500' },
      { label: 'Admins', count: admins, color: 'bg-primary' },
    ];
  },
);
export const selectReportTopMentors = createSelector(selectAdminReports, (r) => r.topMentors);
export const selectReportRecentActivity = createSelector(selectAdminReports, (r) => r.recentActivity);
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
/** User growth chart from store-derived data. */
export const selectReportUserGrowthChartComputed = createSelector(
  selectReportUserGrowthComputed,
  selectReportMaxUsersComputed,
  (data, maxUsers) => ({ data, maxUsers }),
);

export const selectActiveMentorsList = createSelector(selectMyMentors, (m) => m.active);
export const selectPastMentorsList = createSelector(selectMyMentors, (m) => m.past);

export const selectMenteeReports = createSelector(selectDashboardState, (s) => s.menteeReports);

/** Public mentor profile reviews (for mentor profile and reviews page). Filter by mentorId in component. */
export const selectMentorProfileReviews = createSelector(selectDashboardState, (s) => s.mentorProfileReviews);

/** Avg rating derived from menteeReviews (1-5 scale). Returns formatted string. */
export const selectAvgSessionRating = createSelector(
  selectMenteeReviews,
  selectPlatformConfig,
  (reviews, config) => {
    if (!reviews.length) return config?.avgSessionRating ?? DEFAULT_AVG_RATING;
    const sum = reviews.reduce((a, r) => a + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  },
);

/** Platform stats for public/marketing pages (landing, about). Derived from store. */
export const selectPlatformStatsForMarketing = createSelector(selectPlatformUsers, (users) => {
  const total = users.length;
  const mentors = users.filter((u) => u.role === 'mentor' && u.mentorApprovalStatus !== 'rejected').length;
  const mentees = users.filter((u) => u.role === 'mentee').length;
  return { total, mentors, mentees };
});

/** Platform stats + config for marketing (total, mentors, satisfaction, countries, samplePrice). */
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

/** Review count per mentor id (for browse cards and profile). Keys are mentor ids, values are counts. */
export const selectMentorProfileReviewCountByMentorId = createSelector(selectMentorProfileReviews, (reviews) => {
  const map: Record<string, number> = {};
  for (const r of reviews) {
    map[r.mentorId] = (map[r.mentorId] ?? 0) + 1;
  }
  return map;
});

/** Reports with mentee name resolved from myMentees or platformUsers (for mentor/admin views) */
export const selectMenteeReportsWithMenteeNames = createSelector(
  selectMenteeReports,
  selectMyMentees,
  selectPlatformUsers,
  (reports, mentees, users) =>
    reports.map((r) => {
      const fromMentees = mentees.find((m) => m.id === r.menteeId)?.name;
      const fromUsers = users.find((u) => u.id === String(r.menteeId))?.name;
      return {
        ...r,
        menteeName: fromMentees ?? fromUsers ?? `Mentee #${r.menteeId}`,
      };
    }),
);

/** Mentee: only reports for the current user (filter by menteeId). */
export const selectMenteeReportsForCurrentMentee = createSelector(
  selectAuthUser,
  selectMenteeReports,
  (user, reports) =>
    user ? reports.filter((r) => Number(user.id) === r.menteeId) : [],
);

/** Mentor: only reports written by the current user (filter by mentorId), with mentee names. */
export const selectMenteeReportsForCurrentMentor = createSelector(
  selectAuthUser,
  selectMenteeReportsWithMenteeNames,
  (user, reports) =>
    user ? reports.filter((r) => Number(user.id) === r.mentorId) : [],
);

export const selectPastMentorsWithReviews = createSelector(
  selectPastMentorsList,
  selectMenteeReviews,
  selectMenteeReports,
  (past: PastMentorSummary[], reviews: MentorReview[], reports: MenteeReport[]) =>
    past.map((mentor) => ({
      ...mentor,
      review: reviews.find((r) => r.mentorId === mentor.id),
      report: reports.find((r) => r.mentorId === mentor.id),
    })),
);

export const selectMyMenteesPending = createSelector(selectMyMentees, (list) =>
  list.filter((m) => m.status === 'pending'),
);
export const selectMyMenteesActive = createSelector(selectMyMentees, (list) =>
  list.filter((m) => m.status === 'active'),
);
