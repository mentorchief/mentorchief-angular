import { ActionReducerMap } from '@ngrx/store';
import type { AppState } from './app.state';
import { authReducer } from '../features/auth/store/auth.reducer';
import { registrationReducer } from '../features/registration/store/registration.reducer';
import { dashboardReducer } from '../features/dashboard/store/dashboard.reducer';

export const appReducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  registration: registrationReducer,
  dashboard: dashboardReducer,
};

