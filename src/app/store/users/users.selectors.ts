import { createFeatureSelector, createSelector } from '@ngrx/store';
import { usersAdapter } from './users.state';
import type { UsersState } from './users.state';
import { MentorApprovalStatus, UserRole, type User } from '../../core/models/user.model';
import type { MentorProfile } from '../../core/models/mentor-profile.model';

export const selectUsersState = createFeatureSelector<UsersState>('users');

const { selectAll, selectEntities, selectIds } = usersAdapter.getSelectors();

export const selectAllUsers = createSelector(
  selectUsersState,
  (state: UsersState): User[] => selectAll(state),
);

export const selectUserEntities = createSelector(selectUsersState, selectEntities);

export const selectUserIds = createSelector(selectUsersState, selectIds);

export const selectUserById = (userId: string) =>
  createSelector(selectUserEntities, (entities) => entities[userId] ?? null);

export const selectUsersByRole = (role: UserRole) =>
  createSelector(selectAllUsers, (users) => users.filter((u) => u.role === role));

export const selectActiveMentors = createSelector(selectAllUsers, (users) =>
  users.filter((u) => u.role === UserRole.Mentor && u.mentorApprovalStatus !== MentorApprovalStatus.Rejected && u.status !== 'suspended'),
);

export const selectPendingMentorApplications = createSelector(selectAllUsers, (users) =>
  users.filter((u) => u.role === UserRole.Mentor && u.mentorApprovalStatus === MentorApprovalStatus.Pending),
);

/** Alias for backward compatibility - platform users = all users */
export const selectPlatformUsers = selectAllUsers;

/** Maps approved mentors (User[]) → MentorProfile[] for public browse/profile pages. */
export const selectApprovedMentorProfiles = createSelector(selectAllUsers, (users): MentorProfile[] =>
  users
    .filter((u) => u.role === UserRole.Mentor && u.mentorApprovalStatus === MentorApprovalStatus.Approved && u.status !== 'suspended')
    .map((u): MentorProfile => {
      const monthlyPlan = u.mentorPlans?.find((p) => p.duration === 'monthly');
      return {
        id: u.id,
        name: u.name,
        title: u.jobTitle ?? '',
        company: u.company ?? '',
        expertise: u.skills ?? [],
        rating: 0,
        reviews: 0,
        price: monthlyPlan?.price ?? 0,
        bio: u.bio ?? '',
        photoUrl: u.photoUrl ?? '',
        availability: u.availability?.length ? 'Available' : 'Limited',
        sessions: 0,
        responseTime: '',
        yearsOfExperience: u.yearsOfExperience ? Number(u.yearsOfExperience) : 0,
      };
    }),
);
