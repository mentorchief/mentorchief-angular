import type {
  AdminStat,
  PendingAction,
  RecentActivity,
  ReportMetric,
  RevenueBar,
  UserGrowthBar,
  TopMentorRow,
  ReportActivityItem,
  AdminPayment,
} from '../../core/models/dashboard.model';

export interface AdminState {
  stats: AdminStat[];
  pendingActions: PendingAction[];
  recentActivities: RecentActivity[];
  reports: {
    metrics: ReportMetric[];
    revenueData: RevenueBar[];
    userGrowth: UserGrowthBar[];
    topMentors: TopMentorRow[];
    recentActivity: ReportActivityItem[];
  };
  payments: AdminPayment[];
}

export const adminInitialState: AdminState = {
  stats: [],
  pendingActions: [],
  recentActivities: [],
  reports: {
    metrics: [],
    revenueData: [],
    userGrowth: [],
    topMentors: [],
    recentActivity: [],
  },
  payments: [],
};
