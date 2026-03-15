import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { MentorState } from './mentor.state';

export const selectMentorState = createFeatureSelector<MentorState>('mentor');

export const selectMentorStats = createSelector(selectMentorState, (s) => s.stats);

export const selectMentorPendingRequests = createSelector(selectMentorState, (s) => s.pendingRequests);

export const selectMentorActiveMentees = createSelector(selectMentorState, (s) => s.activeMentees);

export const selectMentorEarnings = createSelector(selectMentorState, (s) => s.earnings);

export const selectMyMentees = createSelector(selectMentorState, (s) => s.myMentees);

export const selectMentorPayoutAccount = createSelector(selectMentorState, (s) => s.payoutAccount);

export const selectMentorAcceptingNewMentees = createSelector(selectMentorState, (s) => s.acceptingNewMentees);

export const selectMentorNotificationSettings = createSelector(selectMentorState, (s) => s.notificationSettings);
