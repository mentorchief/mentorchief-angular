import { createReducer, on } from '@ngrx/store';
import { loadPlatformConfig, resetPlatform } from './platform.actions';
import { platformInitialState } from './platform.state';

export const platformReducer = createReducer(
  platformInitialState,
  on(loadPlatformConfig, (state, { config }) => ({ ...state, config })),
  on(resetPlatform, () => platformInitialState),
);
