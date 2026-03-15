import { authReducer } from './auth.reducer';
import {
  login,
  loginSuccess,
  loginFailure,
  logout,
  loadCurrentUserSuccess,
  markRegistered,
  signupSuccess,
} from './auth.actions';

const mockUser = {
  id: 'u1',
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'mentee' as const,
  avatar: 'TU',
  registered: true,
};

describe('authReducer', () => {
  it('should return initial state', () => {
    const state = authReducer(undefined, { type: 'UNKNOWN' });
    expect(state).toEqual({
      user: null,
      isAuthenticated: false,
      isRegistered: false,
      loading: false,
      error: null,
    });
  });

  it('should set user and isAuthenticated on loginSuccess', () => {
    const state = authReducer(undefined, loginSuccess({ user: mockUser }));
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isRegistered).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should set isRegistered false when user.registered is false', () => {
    const unregistered = { ...mockUser, registered: false };
    const state = authReducer(undefined, loginSuccess({ user: unregistered }));
    expect(state.isRegistered).toBe(false);
  });

  it('should clear state on logout', () => {
    const withUser = authReducer(undefined, loginSuccess({ user: mockUser }));
    const state = authReducer(withUser, logout());
    expect(state.user).toBe(null);
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
  });

  it('should set user on loadCurrentUserSuccess', () => {
    const state = authReducer(undefined, loadCurrentUserSuccess({ user: mockUser }));
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should set user null and isAuthenticated false when loadCurrentUserSuccess with null', () => {
    const withUser = authReducer(undefined, loginSuccess({ user: mockUser }));
    const state = authReducer(withUser, loadCurrentUserSuccess({ user: null }));
    expect(state.user).toBe(null);
    expect(state.isAuthenticated).toBe(false);
  });

  it('should update user to registered on markRegistered', () => {
    const unregistered = { ...mockUser, registered: false };
    const withUser = authReducer(undefined, loginSuccess({ user: unregistered }));
    const state = authReducer(withUser, markRegistered({}));
    expect(state.user?.registered).toBe(true);
    expect(state.isRegistered).toBe(true);
  });
});
