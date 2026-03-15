import { dashboardReducer } from './dashboard.reducer';
import {
  declineMentorshipRequest,
  acceptMentorshipRequest,
  submitMentorReview,
  addMenteeReport,
  removeMenteeFromList,
} from './dashboard.actions';

describe('dashboardReducer', () => {
  const initialState = dashboardReducer(undefined, { type: 'UNKNOWN' });

  it('should have initial myMentees and menteeReports', () => {
    expect(initialState.myMentees.length).toBeGreaterThan(0);
    expect(initialState.menteeReports.length).toBeGreaterThan(0);
  });

  it('should remove pending request on declineMentorshipRequest', () => {
    const pendingCount = initialState.mentor.pendingRequests.length;
    if (pendingCount === 0) return;
    const id = initialState.mentor.pendingRequests[0].id;
    const state = dashboardReducer(initialState, declineMentorshipRequest({ requestId: id }));
    expect(state.mentor.pendingRequests.some((r) => r.id === id)).toBe(false);
    expect(state.mentor.pendingRequests.length).toBe(pendingCount - 1);
  });

  it('should add review on submitMentorReview', () => {
    const state = dashboardReducer(
      initialState,
      submitMentorReview({ mentorId: 999, rating: 5, comment: 'Great!' })
    );
    const review = state.menteeReviews.find((r) => r.mentorId === 999);
    expect(review).toBeDefined();
    expect(review?.rating).toBe(5);
    expect(review?.comment).toBe('Great!');
  });

  it('should replace existing review for same mentorId', () => {
    const withReview = dashboardReducer(
      initialState,
      submitMentorReview({ mentorId: 1, rating: 3, comment: 'First' })
    );
    const state = dashboardReducer(
      withReview,
      submitMentorReview({ mentorId: 1, rating: 5, comment: 'Second' })
    );
    const reviews = state.menteeReviews.filter((r) => r.mentorId === 1);
    expect(reviews.length).toBe(1);
    expect(reviews[0].comment).toBe('Second');
  });

  it('should add report and mark mentee completed on addMenteeReport', () => {
    const menteeId = initialState.myMentees[0].id;
    const beforeReports = initialState.menteeReports.length;
    const state = dashboardReducer(
      initialState,
      addMenteeReport({
        menteeId,
        mentorId: 1,
        mentorName: 'Test Mentor',
        summary: 'Test summary',
      })
    );
    expect(state.menteeReports.length).toBe(beforeReports + 1);
    const mentee = state.myMentees.find((m) => m.id === menteeId);
    expect(mentee?.status).toBe('completed');
  });

  it('should remove mentee on removeMenteeFromList', () => {
    const menteeId = initialState.myMentees[0].id;
    const state = dashboardReducer(initialState, removeMenteeFromList({ menteeId }));
    expect(state.myMentees.some((m) => m.id === menteeId)).toBe(false);
  });
});
