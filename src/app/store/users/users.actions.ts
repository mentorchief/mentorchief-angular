import { createActionGroup, props } from '@ngrx/store';
import { MentorApprovalStatus, type User } from '../../core/models/user.model';

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    'Add User': props<{ user: User }>(),
    'Update User': props<{ id: string; changes: Partial<User> }>(),
    'Set Status': props<{ id: string; status: 'active' | 'suspended' }>(),
    'Set Mentor Approval': props<{ id: string; mentorApprovalStatus: MentorApprovalStatus }>(),
    /** Admin UI: simulated async approve/reject (effects apply after delay + toast). */
    'Approve Mentor Request': props<{ userId: string }>(),
    'Reject Mentor Request': props<{ userId: string }>(),
  },
});
