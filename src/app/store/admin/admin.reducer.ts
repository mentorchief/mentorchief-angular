import { createReducer, on } from '@ngrx/store';
import { ROUTES } from '../../core/routes';
import { loadAdminData, resetAdmin } from './admin.actions';
import { adminInitialState, type AdminState } from './admin.state';

const initialAdminData = {
  stats: [
    { label: 'Total Users', value: '2,847', change: '+12.5%' },
    { label: 'Active Mentors', value: '342', change: '+8.2%' },
    { label: 'Active Mentees', value: '1,856', change: '+15.3%' },
    { label: 'Monthly Revenue', value: '$48,325', change: '+22.1%' },
    { label: 'Active Sessions', value: '1,023', change: '+9.7%' },
    { label: 'Platform Growth', value: '+18.4%', change: 'This month' },
  ],
  pendingActions: [
    { title: 'Mentor Applications', count: 12, priority: 'high' as const, path: ROUTES.admin.mentorApplications },
    { title: 'Reported Issues', count: 3, priority: 'high' as const, path: ROUTES.admin.reports },
    { title: 'Feature Requests', count: 24, priority: 'low' as const, path: ROUTES.admin.settings },
  ],
  recentActivities: [
    { type: 'New Mentor', name: 'Emma Wilson', detail: 'Software Engineering', time: '2 hours ago' },
    { type: 'New Mentee', name: 'John Davis', detail: 'Product Management', time: '3 hours ago' },
    { type: 'Payment', name: 'Subscription paid', detail: '$150 from Alex Johnson', time: '5 hours ago' },
    { type: 'Report', name: 'Monthly Report', detail: 'Submitted by Sarah Chen', time: '6 hours ago' },
    { type: 'Review', name: '5-star review', detail: 'From Michael Thompson', time: '8 hours ago' },
  ],
  reports: {
    metrics: [
      { label: 'Total Users', value: '1,247', trend: 12 },
      { label: 'Active Mentorships', value: '342', trend: 8 },
      { label: 'Monthly Revenue', value: '$48,500', trend: 15 },
      { label: 'Avg. Session Rating', value: '4.8', trend: 2 },
    ],
    revenueData: [
      { month: 'Sep', value: 32000 },
      { month: 'Oct', value: 35000 },
      { month: 'Nov', value: 38000 },
      { month: 'Dec', value: 42000 },
      { month: 'Jan', value: 45000 },
      { month: 'Feb', value: 48500 },
    ],
    userGrowth: [
      { label: 'Mentees', count: 892 },
      { label: 'Mentors', count: 342 },
      { label: 'Admins', count: 13 },
    ],
    topMentors: [
      { name: 'Sarah Chen', mentees: 12, earnings: 4500 },
      { name: 'David Lee', mentees: 10, earnings: 3800 },
      { name: 'James Wilson', mentees: 8, earnings: 3200 },
    ],
    recentActivity: [
      { id: 1, text: 'New user registration: Emma Wilson', time: '2 hours ago' },
      { id: 2, text: 'Payment completed: $150 from Alex Johnson', time: '4 hours ago' },
      { id: 3, text: 'Dispute opened: TXN004', time: '1 day ago' },
      { id: 4, text: 'Mentor approved: James Wilson', time: '2 days ago' },
    ],
  },
  payments: [
    { id: 'TXN001', date: 'Mar 1, 2026', mentee: 'Alex Johnson', mentor: 'Sarah Chen', amount: 150, status: 'in_escrow' as const },
    { id: 'TXN002', date: 'Mar 1, 2026', mentee: 'Emma Wilson', mentor: 'Sarah Chen', amount: 400, status: 'in_escrow' as const },
    { id: 'TXN003', date: 'Feb 28, 2026', mentee: 'Michael Brown', mentor: 'David Lee', amount: 200, status: 'completed' as const },
    { id: 'TXN004', date: 'Feb 15, 2026', mentee: 'Sophie Lee', mentor: 'James Wilson', amount: 150, status: 'disputed' as const },
    { id: 'TXN005', date: 'Feb 1, 2026', mentee: 'Alex Johnson', mentor: 'Sarah Chen', amount: 150, status: 'completed' as const },
  ],
};

export const adminReducer = createReducer<AdminState>(
  { ...adminInitialState, ...initialAdminData },
  on(loadAdminData, (_, payload) => ({ ...adminInitialState, ...payload })),
  on(resetAdmin, () => adminInitialState),
);
