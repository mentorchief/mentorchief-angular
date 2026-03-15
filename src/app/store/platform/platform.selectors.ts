import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { PlatformState } from './platform.state';

export const selectPlatformState = createFeatureSelector<PlatformState>('platform');

export const selectPlatformConfig = createSelector(
  selectPlatformState,
  (state) => state.config,
);

export const selectSamplePrice = createSelector(
  selectPlatformConfig,
  (config) => config.samplePrice,
);

export const selectSatisfactionRate = createSelector(
  selectPlatformConfig,
  (config) => config.satisfactionRate,
);
