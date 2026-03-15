import type { User } from './user.model';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isRegistered: boolean;
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
  role: 'mentee' | 'mentor';
}

