import { UserRole } from './user.model';

/**
 * Auth slice: single source of truth for SESSION only.
 * Stores only userId — full user is selected from users slice via selectAuthUser.
 * No duplication of user data.
 */
export interface AuthState {
  userId: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, UserRole.Admin>;
}

