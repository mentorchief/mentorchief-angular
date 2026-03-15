import { createAction, props } from '@ngrx/store';
import type { PlatformConfig } from './platform.state';

export const loadPlatformConfig = createAction(
  '[Platform] Load Config',
  props<{ config: PlatformConfig }>(),
);

export const resetPlatform = createAction('[Platform] Reset');
