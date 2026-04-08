import { createActionGroup, props } from '@ngrx/store';
import type { MenteeReport, MentorProfileReview, MentorReview } from '../../core/models/dashboard.model';

export const ReportsActions = createActionGroup({
  source: 'Reports',
  events: {
    'Submit Mentor Review': props<{ mentorId: string; rating: number; comment: string }>(),
    'Add Mentee Report': props<{ report: Omit<MenteeReport, 'id' | 'createdAt'> }>(),
    'Review Mentee Report': props<{
      reportId: number;
      status: 'approved' | 'rejected';
      reviewerId: string;
      note?: string;
    }>(),
  },
});
