import { createReducer } from '@ngrx/store';
import type {
  AdminStat,
  PendingAction,
  RecentActivity,
  AdminPayment,
  ReportMetric,
  RevenueBar,
  UserGrowthBar,
  TopMentorRow,
  ReportActivityItem,
} from '../../core/models/dashboard.model';
import { ADMIN_SEED } from '../../core/data/admin.seed';

export interface AdminReports {
  metrics: ReportMetric[];
  revenueData: RevenueBar[];
  userGrowth: UserGrowthBar[];
  topMentors: TopMentorRow[];
  recentActivity: ReportActivityItem[];
}

export interface AdminState {
  stats: AdminStat[];
  pendingActions: PendingAction[];
  recentActivities: RecentActivity[];
  reports: AdminReports;
  payments: AdminPayment[];
}

export const adminInitialState: AdminState = {
  stats: ADMIN_SEED.stats,
  pendingActions: ADMIN_SEED.pendingActions,
  recentActivities: ADMIN_SEED.recentActivities,
  reports: ADMIN_SEED.reports,
  payments: ADMIN_SEED.payments,
};

export const adminReducer = createReducer(adminInitialState);
