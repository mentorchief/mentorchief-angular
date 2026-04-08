import type { AdminStat, PendingAction, RecentActivity, ReportMetric, RevenueBar, UserGrowthBar, TopMentorRow, ReportActivityItem, AdminPayment } from '../models/dashboard.model';
import { ROUTES } from '../routes';

export const adminSeedStats: AdminStat[] = [
  { label: 'Total Users', value: '2,847', change: '+12.5%' },
  { label: 'Active Mentors', value: '342', change: '+8.2%' },
  { label: 'Active Mentees', value: '1,856', change: '+15.3%' },
  { label: 'Monthly Revenue', value: '$48,325', change: '+22.1%' },
  { label: 'Active Sessions', value: '1,023', change: '+9.7%' },
  { label: 'Platform Growth', value: '+18.4%', change: 'This month' },
];

export const adminSeedPendingActions: PendingAction[] = [
  { title: 'Mentor Applications', count: 12, priority: 'high', path: ROUTES.admin.mentorApplications },
  { title: 'Reported Issues', count: 3, priority: 'high', path: ROUTES.admin.reports },
  { title: 'Feature Requests', count: 24, priority: 'low', path: ROUTES.admin.settings },
];

export const adminSeedRecentActivities: RecentActivity[] = [
  { type: 'New Mentor', name: 'Emma Wilson', detail: 'Software Engineering', time: '2 hours ago' },
  { type: 'New Mentee', name: 'John Davis', detail: 'Product Management', time: '3 hours ago' },
  { type: 'Payment', name: 'Subscription paid', detail: '$150 from Alex Johnson', time: '5 hours ago' },
  { type: 'Report', name: 'Monthly Report', detail: 'Submitted by Sarah Chen', time: '6 hours ago' },
  { type: 'Review', name: '5-star review', detail: 'From Michael Thompson', time: '8 hours ago' },
];

export const adminSeedReportMetrics: ReportMetric[] = [
  { label: 'Total Users', value: '1,247', trend: 12 },
  { label: 'Active Mentorships', value: '342', trend: 8 },
  { label: 'Monthly Revenue', value: '$48,500', trend: 15 },
  { label: 'Avg. Session Rating', value: '4.8', trend: 2 },
];

export const adminSeedRevenueData: RevenueBar[] = [
  { month: 'Sep', value: 32000 },
  { month: 'Oct', value: 35000 },
  { month: 'Nov', value: 38000 },
  { month: 'Dec', value: 42000 },
  { month: 'Jan', value: 45000 },
  { month: 'Feb', value: 48500 },
];

export const adminSeedUserGrowth: UserGrowthBar[] = [
  { label: 'Mentees', count: 892 },
  { label: 'Mentors', count: 342 },
  { label: 'Admins', count: 13 },
];

export const adminSeedTopMentors: TopMentorRow[] = [
  { name: 'Sarah Chen', mentees: 12, earnings: 4500 },
  { name: 'David Lee', mentees: 10, earnings: 3800 },
  { name: 'James Wilson', mentees: 8, earnings: 3200 },
];

export const adminSeedRecentActivity: ReportActivityItem[] = [
  { id: 1, text: 'New user registration: Emma Wilson', time: '2 hours ago' },
  { id: 2, text: 'Payment completed: $150 from Alex Johnson', time: '4 hours ago' },
  { id: 3, text: 'Dispute opened: TXN004', time: '1 day ago' },
  { id: 4, text: 'Mentor approved: James Wilson', time: '2 days ago' },
];

export const adminSeedPayments: AdminPayment[] = [
  { id: 'TXN001', date: 'Mar 1, 2026', mentee: 'Alex Johnson', mentor: 'Sarah Chen', amount: 150, status: 'in_escrow' },
  { id: 'TXN002', date: 'Mar 1, 2026', mentee: 'Emma Wilson', mentor: 'Sarah Chen', amount: 400, status: 'in_escrow' },
  { id: 'TXN003', date: 'Feb 28, 2026', mentee: 'Michael Brown', mentor: 'David Lee', amount: 200, status: 'completed' },
  { id: 'TXN004', date: 'Feb 15, 2026', mentee: 'Sophie Lee', mentor: 'James Wilson', amount: 150, status: 'disputed' },
  { id: 'TXN005', date: 'Feb 1, 2026', mentee: 'Alex Johnson', mentor: 'Sarah Chen', amount: 150, status: 'completed' },
  { id: 'TXN006', date: 'Jan 20, 2026', mentee: 'Noah Carter', mentor: 'Sarah Chen', amount: 180, status: 'completed' },
  { id: 'TXN007', date: 'Jan 10, 2026', mentee: 'Olivia Reed', mentor: 'David Lee', amount: 220, status: 'in_escrow' },
  { id: 'TXN008', date: 'Dec 28, 2025', mentee: 'Ava Turner', mentor: 'James Wilson', amount: 190, status: 'completed' },
  { id: 'TXN009', date: 'Dec 18, 2025', mentee: 'Ethan Brooks', mentor: 'Sarah Chen', amount: 160, status: 'refunded' },
  { id: 'TXN010', date: 'Dec 2, 2025', mentee: 'Grace Hall', mentor: 'David Lee', amount: 210, status: 'completed' },
  { id: 'TXN011', date: 'Nov 16, 2025', mentee: 'Leo Price', mentor: 'Sarah Chen', amount: 175, status: 'in_escrow' },
  { id: 'TXN012', date: 'Nov 2, 2025', mentee: 'Nina Park', mentor: 'James Wilson', amount: 140, status: 'completed' },
  { id: 'TXN013', date: 'Oct 19, 2025', mentee: 'Omar Diaz', mentor: 'David Lee', amount: 165, status: 'completed' },
  { id: 'TXN014', date: 'Oct 1, 2025', mentee: 'Ruby Stone', mentor: 'Sarah Chen', amount: 155, status: 'in_escrow' },
  { id: 'TXN015', date: 'Sep 15, 2025', mentee: 'Victor Lane', mentor: 'James Wilson', amount: 145, status: 'completed' },
];

export const ADMIN_SEED = {
  stats: adminSeedStats,
  pendingActions: adminSeedPendingActions,
  recentActivities: adminSeedRecentActivities,
  reports: {
    metrics: adminSeedReportMetrics,
    revenueData: adminSeedRevenueData,
    userGrowth: adminSeedUserGrowth,
    topMentors: adminSeedTopMentors,
    recentActivity: adminSeedRecentActivity,
  },
  payments: adminSeedPayments,
};
