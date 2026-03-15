import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap, withLatestFrom } from 'rxjs';
import { UserRole } from '../../core/models/user.model';
import { selectAuthUser } from '../../features/auth/store/auth.selectors';
import { loadCurrentUserSuccess, loginSuccess, logout, markRegistered, signupSuccess } from '../../features/auth/store/auth.actions';
import { initializeForRole, resetSession } from './session.actions';
import {
  loadMentorData,
  resetMentor,
} from '../mentor';
import {
  loadMenteeData,
  resetMentee,
} from '../mentee';
import {
  loadAdminData,
  resetAdmin,
} from '../admin';
import {
  loadConversations,
  resetMessaging,
} from '../messaging';
import {
  loadReports,
  resetReports,
} from '../reports';
import { resetUsers } from '../users';
import { ADMIN_CHATS } from '../../core/data/chats.data';
import { initialMenteeReports, initialMentorProfileReviews } from '../reports/reports.data';
import { ROUTES } from '../../core/routes';

const initialMentorPayload = {
  stats: [
    { label: 'Active Mentees', value: '12' },
    { label: 'Monthly Revenue', value: '$1,800' },
    { label: 'Total Earned', value: '$4,850' },
    { label: 'Avg. Rating', value: '4.9' },
  ],
  pendingRequests: [
    { id: 1, name: 'Jordan Patel', goal: 'First PM Role', message: 'I want to transition into product management from software engineering...', rating: 4.3 },
    { id: 2, name: 'Emma Wilson', goal: 'Senior Role Prep', message: 'Looking for guidance on getting promoted to senior PM...', rating: null },
  ],
  activeMentees: [
    { id: 1, name: 'Alex Thompson', goal: 'PM Career Transition', progress: 75, monthsActive: 2 },
    { id: 2, name: 'Maya Johnson', goal: 'Product Strategy Skills', progress: 45, monthsActive: 1 },
    { id: 3, name: 'Chris Lee', goal: 'Senior PM Promotion', progress: 90, monthsActive: 3 },
  ],
  earnings: [
    { month: 'March 2026', amount: 1800, status: 'In Escrow', mentees: 12 },
    { month: 'February 2026', amount: 1650, status: 'Released', mentees: 11 },
    { month: 'January 2026', amount: 1400, status: 'Released', mentees: 10 },
  ],
  myMentees: [
    { id: 1, name: 'Alex Johnson', avatar: '', email: 'alex@example.com', plan: 'Monthly', startDate: 'Jan 15, 2026', progress: 75, status: 'active' as const },
    { id: 2, name: 'Emma Wilson', avatar: '', email: 'emma@example.com', plan: 'Quarterly', startDate: 'Feb 1, 2026', progress: 45, status: 'active' as const },
    { id: 3, name: 'Michael Brown', avatar: '', email: 'michael@example.com', plan: 'Monthly', startDate: 'Mar 1, 2026', progress: 10, status: 'active' as const },
    { id: 4, name: 'Sophie Lee', avatar: '', email: 'sophie@example.com', plan: 'Monthly', startDate: '-', progress: 0, status: 'pending' as const },
  ],
};

const initialMenteePayload = {
  activeMentorship: {
    mentorId: '1',
    mentorName: 'Sarah Chen',
    mentorTitle: 'Senior PM',
    mentorCompany: 'Google',
    mentorImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
    monthsActive: 2,
    progress: 50,
  },
  subscription: {
    planName: 'Monthly Subscription',
    amount: 150,
    currency: 'USD',
    nextBillingDate: 'April 1, 2026',
    status: 'active' as const,
    startedAt: '2026-03-10',
  },
  payments: [
    { id: '1', month: 'March 2026', amount: 150, status: 'in_escrow' as const, releaseDate: 'Apr 1, 2026', paidToMentor: false },
    { id: '2', month: 'February 2026', amount: 150, status: 'released' as const, paidToMentor: true },
  ],
  myMentors: {
    active: [
      { id: 1, name: 'Sarah Chen', title: 'Senior PM', company: 'Google', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', startDate: 'Feb 1, 2026', price: 150, progress: 65 },
    ],
    past: [
      { id: 2, name: 'David Lee', title: 'Lead PM', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', startDate: 'Jun 1, 2025', endDate: 'Dec 15, 2025' },
    ],
  },
};

const initialAdminPayload = {
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

@Injectable()
export class SessionEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);

  readonly initializeOnLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loginSuccess),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([, user]) => {
          if (user) this.store.dispatch(initializeForRole({ role: user.role }));
        }),
      ),
    { dispatch: false },
  );

  readonly initializeOnSignup$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(signupSuccess),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([, user]) => {
          if (user?.registered) {
            this.store.dispatch(initializeForRole({ role: user.role }));
          }
        }),
      ),
    { dispatch: false },
  );

  readonly initializeOnMarkRegistered$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(markRegistered),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([, user]) => {
          if (user) {
            this.store.dispatch(initializeForRole({ role: user.role }));
          }
        }),
      ),
    { dispatch: false },
  );

  readonly initializeOnLoadUser$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loadCurrentUserSuccess),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([{ userId }, user]) => {
          if (userId && user) {
            this.store.dispatch(initializeForRole({ role: user.role }));
          } else {
            this.store.dispatch(resetSession());
          }
        }),
      ),
    { dispatch: false },
  );

  readonly initializeForRole$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(initializeForRole),
        tap(({ role }) => {
          this.store.dispatch(loadConversations({
            conversations: ADMIN_CHATS,
            mentorUnread: role === UserRole.Mentor ? { 'conv-1': 1, 'conv-2': 2 } : {},
          }));
          this.store.dispatch(loadReports({
            menteeReviews: [],
            mentorProfileReviews: initialMentorProfileReviews,
            menteeReports: initialMenteeReports,
          }));
          if (role === UserRole.Mentor) {
            this.store.dispatch(loadMentorData(initialMentorPayload));
          } else {
            this.store.dispatch(resetMentor());
          }
          if (role === UserRole.Mentee) {
            this.store.dispatch(loadMenteeData(initialMenteePayload));
          } else {
            this.store.dispatch(resetMentee());
          }
          if (role === UserRole.Admin) {
            this.store.dispatch(loadAdminData(initialAdminPayload));
          } else {
            this.store.dispatch(resetAdmin());
          }
        }),
      ),
    { dispatch: false },
  );

  readonly resetOnLogout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logout),
        tap(() => {
          this.store.dispatch(resetSession());
        }),
      ),
    { dispatch: false },
  );

  readonly resetSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(resetSession),
        tap(() => {
          this.store.dispatch(resetMentor());
          this.store.dispatch(resetMentee());
          this.store.dispatch(resetAdmin());
          this.store.dispatch(resetMessaging());
          this.store.dispatch(resetReports());
        }),
      ),
    { dispatch: false },
  );
}
