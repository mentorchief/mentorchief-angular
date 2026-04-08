import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const MenteeActions = createActionGroup({
  source: 'Mentee',
  events: {
    'Cancel Subscription': emptyProps(),
    'Request Mentorship': props<{ mentorId: string; plan: string; message: string }>(),
    'Cancel Mentorship Request': props<{ mentorId: string }>(),
  },
});
