import { createAction, props } from '@ngrx/store';
import { MentorApprovalStatus, type User } from '../../core/models/user.model';

export const loadUsers = createAction('[Users] Load Users', props<{ users: User[] }>());

export const addUser = createAction('[Users] Add User', props<{ user: User }>());

export const updateUserStatus = createAction(
  '[Users] Update User Status',
  props<{ userId: string; status: 'active' | 'suspended' }>(),
);

export const setMentorApprovalStatus = createAction(
  '[Users] Set Mentor Approval Status',
  props<{ userId: string; mentorApprovalStatus: MentorApprovalStatus }>(),
);

export const updateUserProfile = createAction(
  '[Users] Update User Profile',
  props<{ userId: string; updates: Partial<User> }>(),
);

export const resetUsers = createAction('[Users] Reset Users');
