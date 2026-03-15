import { createAction, props } from '@ngrx/store';

export const loadReports = createAction(
  '[Reports] Load',
  props<{
    menteeReviews: { mentorId: number; rating: number; comment: string; submittedAt: string }[];
    mentorProfileReviews: { mentorId: string; name: string; rating: number; text: string }[];
    menteeReports: {
      id: number;
      menteeId: number;
      mentorId: number;
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
  props<{ mentorId: number; rating: number; comment: string }>(),
);

export const addMenteeReport = createAction(
  '[Reports] Add Mentee Report',
  props<{
    menteeId: number;
    mentorId: number;
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
