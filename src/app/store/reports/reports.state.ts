import type { MentorReview, MentorProfileReview, MenteeReport } from '../../core/models/dashboard.model';

export interface ReportsState {
  menteeReviews: MentorReview[];
  mentorProfileReviews: MentorProfileReview[];
  menteeReports: MenteeReport[];
}

export const reportsInitialState: ReportsState = {
  menteeReviews: [],
  mentorProfileReviews: [],
  menteeReports: [],
};
