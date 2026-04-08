import { createFeatureSelector } from '@ngrx/store';
import type { MenteeState } from './mentee.reducer';

export const selectMenteeState = createFeatureSelector<MenteeState>('mentee');
