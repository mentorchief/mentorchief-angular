import { selectAuthState, selectAuthUser, selectIsAuthenticated, selectIsRegistered } from './auth.selectors';
import type { AppState } from '../../../store/app.state';

const appState: AppState = {
  auth: {
    user: {
      id: 'u1',
      name: 'Test',
      email: 'test@example.com',
      password: 'password123',
      role: 'mentee',
      avatar: 'T',
      registered: true,
    },
    isAuthenticated: true,
    isRegistered: true,
    loading: false,
    error: null,
  },
  registration: {} as AppState['registration'],
  dashboard: {} as AppState['dashboard'],
};

describe('auth selectors', () => {
  it('selectAuthState should return auth slice', () => {
    const result = selectAuthState(appState);
    expect(result).toEqual(appState.auth);
  });

  it('selectAuthUser should return user', () => {
    const result = selectAuthUser(appState);
    expect(result).toEqual(appState.auth.user);
  });

  it('selectIsAuthenticated should return true when authenticated', () => {
    const result = selectIsAuthenticated(appState);
    expect(result).toBe(true);
  });

  it('selectIsRegistered should return true when user.registered', () => {
    const result = selectIsRegistered(appState);
    expect(result).toBe(true);
  });

  it('selectIsAuthenticated should return false when no user', () => {
    const emptyAuth = { ...appState.auth, user: null, isAuthenticated: false };
    const state: AppState = { ...appState, auth: emptyAuth };
    const result = selectIsAuthenticated(state);
    expect(result).toBe(false);
  });
});
