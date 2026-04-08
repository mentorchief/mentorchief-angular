import { createFeatureSelector } from '@ngrx/store';
import type { MessagingState } from './messaging.reducer';

export const selectMessagingState = createFeatureSelector<MessagingState>('messaging');
