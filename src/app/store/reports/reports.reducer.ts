import { createReducer, on } from '@ngrx/store';
import type { MenteeReport, MentorProfileReview, MentorReview } from '../../core/models/dashboard.model';
import { initialMenteeReports, initialMentorProfileReviews } from '../../core/data/reports.data';
import { ReportsActions } from './reports.actions';

export interface ReportsState {
  menteeReviews: MentorReview[];
  mentorProfileReviews: MentorProfileReview[];
  menteeReports: MenteeReport[];
}

export const reportsInitialState: ReportsState = {
  menteeReviews: [],
  mentorProfileReviews: [...initialMentorProfileReviews],
  menteeReports: [...initialMenteeReports],
};

export const reportsReducer = createReducer(
  reportsInitialState,
  on(ReportsActions.submitMentorReview, (s, { mentorId, rating, comment }): ReportsState => {
    const submittedAt = new Date().toISOString();
    const filtered = s.menteeReviews.filter((r) => r.mentorId !== mentorId);
    return {
      ...s,
      menteeReviews: [...filtered, { mentorId, rating, comment, submittedAt }],
    };
  }),
  on(ReportsActions.addMenteeReport, (s, { report }): ReportsState => {
    const id = s.menteeReports.length ? Math.max(...s.menteeReports.map((r) => r.id)) + 1 : 1;
    return {
      ...s,
      menteeReports: [
        ...s.menteeReports,
        { ...report, id, createdAt: new Date().toISOString(), adminReviewStatus: 'pending' },
      ],
    };
  }),
  on(ReportsActions.reviewMenteeReport, (s, { reportId, status, reviewerId, note }): ReportsState => ({
    ...s,
    menteeReports: s.menteeReports.map((r) =>
      r.id === reportId
        ? {
            ...r,
            adminReviewStatus: status,
            adminReviewedAt: new Date().toISOString(),
            adminReviewerId: reviewerId,
            adminReviewNote: note?.trim() || undefined,
          }
        : r,
    ),
  })),
);
