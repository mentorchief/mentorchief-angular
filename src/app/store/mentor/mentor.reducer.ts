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
import { defaultNotificationSettings, mentorInitialState, type MentorState } from './mentor.state';
export const mentorReducer = createReducer<MentorState>(
  mentorInitialState,
  on(loadMentorData, (_, { stats, pendingRequests, activeMentees, earnings, myMentees }) => ({
    ...mentorInitialState,
    stats,
    pendingRequests,
    activeMentees,
    earnings,
    myMentees,
    payoutAccount: null,
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
