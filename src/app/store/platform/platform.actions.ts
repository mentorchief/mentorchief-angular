import { createAction, props } from '@ngrx/store';
import type { PlatformConfig } from './platform.state';

export const loadPlatformConfig = createAction(
  '[Platform] Load Config',
  props<{ config: PlatformConfig }>(),
);

export const updatePlatformConfig = createAction(
  '[Platform] Update Config',
  props<{ config: Partial<PlatformConfig> }>(),
);

export const resetPlatform = createAction('[Platform] Reset');
