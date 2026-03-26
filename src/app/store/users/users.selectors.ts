import { createFeatureSelector, createSelector } from '@ngrx/store';
import { usersAdapter } from './users.state';
import type { UsersState } from './users.state';
import { MentorApprovalStatus, UserRole, type User } from '../../core/models/user.model';
import type { Mentor } from '../../core/models/mentor.model';

export function userToMentor(u: User): Mentor {
  return {
    id: u.id,
    name: u.name,
    title: u.jobTitle ?? '',
    company: u.company ?? '',
    expertise: u.skills ?? [],
    rating: 0,
    reviews: 0,
    price: parseFloat(u.subscriptionCost ?? '0') || 0,
    bio: u.bio ?? '',
    image: u.avatar,
    availability: u.acceptingMentees !== false ? 'Available' : 'Not Available',
    sessions: 0,
    responseTime: '',
    yearsOfExperience: parseInt(u.yearsOfExperience ?? '0', 10) || 0,
    mentorPlans: u.mentorPlans ?? [],
    acceptingMentees: u.acceptingMentees !== false,
    featured: u.featured === true,
  };
}

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
  users.filter(
    (u) =>
      u.role === UserRole.Mentor &&
      u.registered === true &&
      u.mentorApprovalStatus === MentorApprovalStatus.Approved &&
      u.status !== 'suspended',
  ),
);

export const selectPendingMentorApplications = createSelector(selectAllUsers, (users) =>
  users.filter((u) => u.role === UserRole.Mentor && u.registered === true && u.mentorApprovalStatus === MentorApprovalStatus.Pending),
);

/** Alias for backward compatibility - platform users = all users */
export const selectPlatformUsers = selectAllUsers;

/** Active approved mentors mapped to the Mentor shape used by public browse/profile pages. */
export const selectActiveMentorsAsMentor = createSelector(selectActiveMentors, (mentors) =>
  mentors.map(userToMentor),
);

/** Featured mentors (admin-selected) with fallback to first 3 approved mentors. */
export const selectFeaturedMentorsAsMentor = createSelector(selectActiveMentorsAsMentor, (mentors) => {
  const featured = mentors.filter((m) => m.featured);
  return featured.length > 0 ? featured : mentors.slice(0, 3);
});
