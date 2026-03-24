import { createReducer, on } from '@ngrx/store';
import { usersAdapter, usersInitialState } from './users.state';
import {
  addUser,
  loadUsers,
  resetUsers,
  setMentorApprovalStatus,
  updateUserProfile,
  updateUserStatus,
} from './users.actions';

const initialState = usersInitialState;

export const usersReducer = createReducer(
  initialState,
  on(loadUsers, (state, { users }) => usersAdapter.setAll(users, usersInitialState)),
  on(addUser, (state, { user }) =>
    usersAdapter.upsertOne(
      {
        ...user,
        status: user.status ?? 'active',
        joinDate:
          user.joinDate ??
          new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      },
      state,
    ),
  ),
  on(updateUserStatus, (state, { userId, status }) =>
    usersAdapter.updateOne({ id: userId, changes: { status } }, state),
  ),
  on(setMentorApprovalStatus, (state, { userId, mentorApprovalStatus }) =>
    usersAdapter.updateOne({ id: userId, changes: { mentorApprovalStatus } }, state),
  ),
  on(updateUserProfile, (state, { userId, updates }) =>
    usersAdapter.updateOne({ id: userId, changes: updates }, state),
  ),
  on(resetUsers, () => usersInitialState),
);
