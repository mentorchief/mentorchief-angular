import { createActionGroup, props } from '@ngrx/store';
import type { PlatformConfig } from '../../core/data/platform.state';

export const PlatformActions = createActionGroup({
  source: 'Platform',
  events: {
    'Update Config': props<{ changes: Partial<PlatformConfig> }>(),
  },
});
