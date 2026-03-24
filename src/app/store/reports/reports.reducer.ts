import { createReducer, on } from '@ngrx/store';
import type { MenteeReport } from '../../core/models/dashboard.model';
import { addMenteeReport, loadReports, resetReports, submitMentorReview } from './reports.actions';
import { reportsInitialState } from './reports.state';

export const reportsReducer = createReducer(
  reportsInitialState,
  on(loadReports, (_, { menteeReviews, mentorProfileReviews, menteeReports }) => ({
    menteeReviews,
    mentorProfileReviews,
    menteeReports,
  })),
  on(resetReports, () => reportsInitialState),
  on(submitMentorReview, (state, { mentorId, rating, comment }) => {
    const submittedAt = new Date().toISOString();
    const newReview = { mentorId, rating, comment, submittedAt };
    const filtered = state.menteeReviews.filter((r) => r.mentorId !== mentorId);
    return { ...state, menteeReviews: [...filtered, newReview] };
  }),
  on(addMenteeReport, (state, payload) => {
    const { menteeId, mentorId, mentorName, summary } = payload;
    const newReport: MenteeReport = {
      id: state.menteeReports.length ? Math.max(...state.menteeReports.map((r) => r.id)) + 1 : 1,
      menteeId,
      mentorId,
      mentorName,
      createdAt: new Date().toISOString(),
      summary,
      rating: payload.rating,
      behaviour: payload.behaviour,
      strengths: payload.strengths,
      weaknesses: payload.weaknesses,
      areasToDevelop: payload.areasToDevelop,
      recommendations: payload.recommendations,
    };
    return { ...state, menteeReports: [...state.menteeReports, newReport] };
  }),
);
