import { createAction, props } from '@ngrx/store';

export const loadReports = createAction(
  '[Reports] Load',
  props<{
    menteeReviews: { mentorId: string; rating: number; comment: string; submittedAt: string }[];
    mentorProfileReviews: { mentorId: string; name: string; rating: number; text: string }[];
    menteeReports: {
      id: number;
      menteeId: string;
      mentorId: string;
      mentorName: string;
      createdAt: string;
      summary: string;
      rating?: number;
      behaviour?: string;
      strengths?: string[];
      weaknesses?: string[];
      areasToDevelop?: string[];
      recommendations?: string;
    }[];
  }>(),
);

export const submitMentorReview = createAction(
  '[Reports] Submit Mentor Review',
  props<{ mentorId: string; rating: number; comment: string }>(),
);

export const addMenteeReport = createAction(
  '[Reports] Add Mentee Report',
  props<{
    menteeId: string;
    mentorId: string;
    mentorName: string;
    summary: string;
    rating?: number;
    behaviour?: string;
    strengths?: string[];
    weaknesses?: string[];
    areasToDevelop?: string[];
    recommendations?: string;
  }>(),
);

export const resetReports = createAction('[Reports] Reset');
