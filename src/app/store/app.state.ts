import type { AuthState } from '../core/models/auth.model';
import type { RegistrationState } from '../core/models/registration.model';
import type { DashboardState } from '../core/models/dashboard.model';

export interface AppState {
  auth: AuthState;
  registration: RegistrationState;
  dashboard: DashboardState;
}

