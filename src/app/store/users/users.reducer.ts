import { createReducer, on } from '@ngrx/store';
import { DEFAULT_MENTEE_CAPACITY } from '../../core/constants';
import { INITIAL_USERS } from '../../core/data/users.seed';
import type { User } from '../../core/models/user.model';
import { UserRole } from '../../core/models/user.model';
import { UsersActions } from './users.actions';

export const usersInitialState: User[] = [...INITIAL_USERS];

export const usersReducer = createReducer(
  usersInitialState,
  on(UsersActions.addUser, (state, { user }): User[] => {
    const base: User = {
      ...user,
      status: user.status ?? 'active',
      joinDate:
        user.joinDate ??
        new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    const withCapacity =
      base.role === UserRole.Mentor && !String(base.menteeCapacity ?? '').trim()
        ? { ...base, menteeCapacity: String(DEFAULT_MENTEE_CAPACITY) }
        : base;
    return [...state, withCapacity];
  }),
  on(UsersActions.updateUser, (state, { id, changes }): User[] =>
    state.map((u) => (u.id === id ? { ...u, ...changes } : u)),
  ),
  on(UsersActions.setStatus, (state, { id, status }): User[] =>
    state.map((u) => (u.id === id ? { ...u, status } : u)),
  ),
  on(UsersActions.setMentorApproval, (state, { id, mentorApprovalStatus }): User[] =>
    state.map((u) => (u.id === id ? { ...u, mentorApprovalStatus } : u)),
  ),
);
