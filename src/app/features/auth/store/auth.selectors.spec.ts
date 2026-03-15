import { selectAuthState, selectAuthUser, selectAuthUserId, selectIsAuthenticated, selectIsRegistered } from './auth.selectors';
import type { AppState } from '../../../store/app.state';
import { UserRole } from '../../../core/models/user.model';
import { usersAdapter } from '../../../store/users/users.state';

const mockUser = {
  id: 'u1',
  name: 'Test',
  email: 'test@example.com',
  password: 'password123',
  role: UserRole.Mentee,
  avatar: 'T',
  registered: true,
};

const usersState = usersAdapter.addOne(mockUser, usersAdapter.getInitialState());

const appState: AppState = {
  auth: {
    userId: 'u1',
    loading: false,
    error: null,
  },
  registration: {} as AppState['registration'],
  users: usersState,
  platform: {} as AppState['platform'],
  mentor: {} as AppState['mentor'],
  mentee: {} as AppState['mentee'],
  messaging: {} as AppState['messaging'],
  reports: {} as AppState['reports'],
  admin: {} as AppState['admin'],
};

describe('auth selectors', () => {
  it('selectAuthState should return auth slice', () => {
    const result = selectAuthState(appState);
    expect(result).toEqual(appState.auth);
  });

  it('selectAuthUserId should return userId', () => {
    const result = selectAuthUserId(appState);
    expect(result).toBe('u1');
  });

  it('selectAuthUser should return user from users slice', () => {
    const result = selectAuthUser(appState);
    expect(result).toEqual(mockUser);
  });

  it('selectIsAuthenticated should return true when userId set', () => {
    const result = selectIsAuthenticated(appState);
    expect(result).toBe(true);
  });

  it('selectIsRegistered should return true when user.registered', () => {
    const result = selectIsRegistered(appState);
    expect(result).toBe(true);
  });

  it('selectIsAuthenticated should return false when no userId', () => {
    const emptyAuth = { ...appState.auth, userId: null };
    const state: AppState = { ...appState, auth: emptyAuth };
    const result = selectIsAuthenticated(state);
    expect(result).toBe(false);
  });
});
