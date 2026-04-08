import { createFeatureSelector } from '@ngrx/store';
import type { MentorState } from './mentor.reducer';

export const selectMentorState = createFeatureSelector<MentorState>('mentor');
