import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { AdminState } from './admin.state';

export const selectAdminState = createFeatureSelector<AdminState>('admin');

export const selectAdminStats = createSelector(selectAdminState, (s) => s.stats);

export const selectAdminPendingActions = createSelector(selectAdminState, (s) => s.pendingActions);

export const selectAdminRecentActivities = createSelector(selectAdminState, (s) => s.recentActivities);

export const selectAdminReports = createSelector(selectAdminState, (s) => s.reports);

export const selectAdminPayments = createSelector(selectAdminState, (s) => s.payments);

export const selectReportMetrics = createSelector(selectAdminReports, (r) => r.metrics);

export const selectReportRevenueData = createSelector(selectAdminReports, (r) => r.revenueData);

export const selectReportUserGrowth = createSelector(selectAdminReports, (r) => r.userGrowth);

export const selectReportTopMentors = createSelector(selectAdminReports, (r) => r.topMentors);

export const selectReportRecentActivity = createSelector(selectAdminReports, (r) => r.recentActivity);
