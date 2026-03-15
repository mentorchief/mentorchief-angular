import { createReducer, on } from '@ngrx/store';
import type { ActiveMenteeSummary, MenteeListItem } from '../../core/models/dashboard.model';
import {
  acceptMenteeRequest,
  acceptMentorshipRequest,
  declineMentorshipRequest,
  loadMentorData,
  markMenteeCompleted,
  removeMenteeFromList,
  resetMentor,
  setMentorAcceptingNewMentees,
  setMentorNotificationSetting,
  setMentorPendingRequests,
  updateMentorPayoutAccount,
} from './mentor.actions';
import { defaultPayoutAccount, defaultNotificationSettings, mentorInitialState, type MentorState } from './mentor.state';

const initialMentorData = {
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

export const mentorReducer = createReducer<MentorState>(
  { ...mentorInitialState, ...initialMentorData },
  on(loadMentorData, (_, { stats, pendingRequests, activeMentees, earnings, myMentees }) => ({
    ...mentorInitialState,
    stats,
    pendingRequests,
    activeMentees,
    earnings,
    myMentees,
    payoutAccount: defaultPayoutAccount,
    acceptingNewMentees: true,
    notificationSettings: defaultNotificationSettings,
  })),
  on(resetMentor, () => mentorInitialState),
  on(declineMentorshipRequest, (state, { requestId: id }) => ({
    ...state,
    pendingRequests: state.pendingRequests.filter((r) => r.id !== id),
  })),
  on(acceptMentorshipRequest, (state, { request }) => {
    const newMentee: ActiveMenteeSummary = {
      id: request.id,
      name: request.name,
      goal: request.goal,
      progress: 0,
      monthsActive: 0,
    };
    return {
      ...state,
      pendingRequests: state.pendingRequests.filter((r) => r.id !== request.id),
      activeMentees: [...state.activeMentees, newMentee],
    };
  }),
  on(setMentorPendingRequests, (state, { requests }) => ({ ...state, pendingRequests: requests })),
  on(removeMenteeFromList, (state, { menteeId }) => ({
    ...state,
    myMentees: state.myMentees.filter((m) => m.id !== menteeId),
  })),
  on(acceptMenteeRequest, (state, { menteeId }) => ({
    ...state,
    myMentees: state.myMentees.map((m) =>
      m.id === menteeId ? { ...m, status: 'active' as const, startDate: m.startDate === '-' ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : m.startDate } : m,
    ),
  })),
  on(updateMentorPayoutAccount, (state, { payoutAccount }) => ({ ...state, payoutAccount })),
  on(setMentorAcceptingNewMentees, (state, { accepting }) => ({ ...state, acceptingNewMentees: accepting })),
  on(setMentorNotificationSetting, (state, { id, enabled }) => ({
    ...state,
    notificationSettings: state.notificationSettings.map((s) => (s.id === id ? { ...s, enabled } : s)),
  })),
  on(markMenteeCompleted, (state, { menteeId }) => ({
    ...state,
    myMentees: state.myMentees.map((m) => (m.id === menteeId ? { ...m, status: 'completed' as const } : m)),
  })),
);
