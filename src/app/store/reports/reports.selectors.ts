import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { ReportsState } from './reports.state';

export const selectReportsState = createFeatureSelector<ReportsState>('reports');

export const selectMenteeReviews = createSelector(selectReportsState, (s) => s.menteeReviews);

export const selectMentorProfileReviews = createSelector(selectReportsState, (s) => s.mentorProfileReviews);

export const selectMenteeReports = createSelector(selectReportsState, (s) => s.menteeReports);
