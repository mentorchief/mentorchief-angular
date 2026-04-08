import { createReducer, on } from '@ngrx/store';
import type { PlatformConfig } from '../../core/data/platform.state';
import { platformInitialState } from '../../core/data/platform.state';
import { PlatformActions } from './platform.actions';

export type PlatformState = PlatformConfig;

const initial: PlatformState = { ...platformInitialState.config };

export const platformReducer = createReducer(
  initial,
  on(PlatformActions.updateConfig, (state, { changes }): PlatformState => ({ ...state, ...changes })),
);
