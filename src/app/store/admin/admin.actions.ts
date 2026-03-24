import { createAction, props } from '@ngrx/store';
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

export const loadAdminPayments = createAction(
  '[Admin] Load Payments',
  props<{ payments: AdminPayment[] }>(),
);

export const releasePayment = createAction(
  '[Admin] Release Payment',
  props<{ paymentId: string }>(),
);

export const loadAdminData = createAction('[Admin] Load Data', props<{
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
}>());

export const resetAdmin = createAction('[Admin] Reset');
