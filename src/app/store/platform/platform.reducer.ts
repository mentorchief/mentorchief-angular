import { createReducer, on } from '@ngrx/store';
import { loadPlatformConfig, resetPlatform, updatePlatformConfig } from './platform.actions';
import { platformInitialState } from './platform.state';

export const platformReducer = createReducer(
  platformInitialState,
  on(loadPlatformConfig, (state, { config }) => ({ ...state, config })),
  on(updatePlatformConfig, (state, { config }) => ({ ...state, config: { ...state.config, ...config } })),
  on(resetPlatform, () => platformInitialState),
);
