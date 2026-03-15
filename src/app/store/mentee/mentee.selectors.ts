import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { MenteeState } from './mentee.state';

export const selectMenteeState = createFeatureSelector<MenteeState>('mentee');

export const selectActiveMentorship = createSelector(selectMenteeState, (s) => s.activeMentorship);

export const selectMenteeSubscription = createSelector(selectMenteeState, (s) => s.subscription);

export const selectMenteePayments = createSelector(selectMenteeState, (s) => s.payments);

export const selectMyMentors = createSelector(selectMenteeState, (s) => s.myMentors);

export const selectActiveMentorsList = createSelector(selectMyMentors, (m) => m.active);

export const selectPastMentorsList = createSelector(selectMyMentors, (m) => m.past);
