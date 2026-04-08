import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { ReportsState } from './reports.reducer';

export const selectReportsState = createFeatureSelector<ReportsState>('reports');

export const selectMenteeReviews = createSelector(selectReportsState, (s) => s.menteeReviews);
export const selectMentorProfileReviews = createSelector(selectReportsState, (s) => s.mentorProfileReviews);
export const selectMenteeReports = createSelector(selectReportsState, (s) => s.menteeReports);

export const selectReviewCountByMentorId = createSelector(selectMentorProfileReviews, (reviews) => {
  const map: Record<string, number> = {};
  for (const r of reviews) {
    map[r.mentorId] = (map[r.mentorId] ?? 0) + 1;
  }
  return map;
});
