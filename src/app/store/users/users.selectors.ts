import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MentorApprovalStatus, UserRole, type User } from '../../core/models/user.model';

export const selectUsersState = createFeatureSelector<User[]>('users');

export const selectAllUsers = createSelector(selectUsersState, (users) => users);

export const selectUserById = (id: string) =>
  createSelector(selectAllUsers, (users) => users.find((u) => u.id === id) ?? null);

export const selectPendingMentors = createSelector(selectAllUsers, (users) =>
  users.filter((u) => u.role === UserRole.Mentor && u.mentorApprovalStatus === MentorApprovalStatus.Pending),
);

export const selectApprovedMentors = createSelector(selectAllUsers, (users) =>
  users.filter(
    (u) =>
      u.role === UserRole.Mentor &&
      u.mentorApprovalStatus === MentorApprovalStatus.Approved &&
      u.status !== 'suspended',
  ),
);
