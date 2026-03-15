import { authReducer } from './auth.reducer';
import {
  login,
  loginSuccess,
  loginFailure,
  logout,
  loadCurrentUserSuccess,
  signupSuccess,
} from './auth.actions';

describe('authReducer', () => {
  it('should return initial state', () => {
    const state = authReducer(undefined, { type: 'UNKNOWN' });
    expect(state).toEqual({
      userId: null,
      loading: false,
      error: null,
    });
  });

  it('should set userId on loginSuccess', () => {
    const state = authReducer(undefined, loginSuccess({ userId: 'u1' }));
    expect(state.userId).toBe('u1');
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should clear state on logout', () => {
    const withUser = authReducer(undefined, loginSuccess({ userId: 'u1' }));
    const state = authReducer(withUser, logout());
    expect(state.userId).toBe(null);
    expect(state.loading).toBe(false);
  });

  it('should set userId on loadCurrentUserSuccess', () => {
    const state = authReducer(undefined, loadCurrentUserSuccess({ userId: 'u1' }));
    expect(state.userId).toBe('u1');
  });

  it('should set userId null when loadCurrentUserSuccess with null', () => {
    const withUser = authReducer(undefined, loginSuccess({ userId: 'u1' }));
    const state = authReducer(withUser, loadCurrentUserSuccess({ userId: null }));
    expect(state.userId).toBe(null);
  });
});
