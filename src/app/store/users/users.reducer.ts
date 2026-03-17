import { createReducer, on } from '@ngrx/store';
import { usersAdapter } from './users.state';
import {
  addUser,
  loadUsers,
  resetUsers,
  setMentorApprovalStatus,
  updateUserProfile,
  updateUserStatus,
} from './users.actions';
import { usersInitialState } from './users.state';
import { MentorApprovalStatus, UserRole, type User } from '../../core/models/user.model';

const initialUsers: User[] = [
  { id: '1', name: 'Alex Johnson', email: 'mentee@demo.com', password: 'password123', role: UserRole.Mentee, avatar: 'AJ', registered: true, status: 'active', joinDate: 'Feb 1, 2026', phone: '15551234568' },
  { id: '2', name: 'Sarah Chen', email: 'mentor@demo.com', password: 'password123', role: UserRole.Mentor, avatar: 'SC', registered: true, mentorApprovalStatus: MentorApprovalStatus.Approved, status: 'active', joinDate: 'Jan 15, 2026', phone: '15551234567' },
  { id: '3', name: 'Admin User', email: 'admin@mentorchief.com', password: 'admin2026', role: UserRole.Admin, avatar: 'AD', registered: true, status: 'active', joinDate: 'Jan 1, 2026' },
];

const initialState = usersAdapter.addMany(initialUsers, usersInitialState);

export const usersReducer = createReducer(
  initialState,
  on(loadUsers, (state, { users }) => usersAdapter.setAll(users, usersInitialState)),
  on(addUser, (state, { user }) =>
    usersAdapter.addOne(
      { ...user, status: user.status ?? 'active', joinDate: user.joinDate ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
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
  on(resetUsers, () => initialState),
);
