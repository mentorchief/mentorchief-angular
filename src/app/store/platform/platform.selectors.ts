import { createFeatureSelector } from '@ngrx/store';
import type { PlatformState } from './platform.reducer';

export const selectPlatformState = createFeatureSelector<PlatformState>('platform');
