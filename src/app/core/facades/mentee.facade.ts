import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { MenteeActions } from '../../store/mentee/mentee.actions';
import { selectMenteeState } from '../../store/mentee/mentee.selectors';

@Injectable({ providedIn: 'root' })
export class MenteeFacade {
  private readonly store = inject(Store);

  readonly data$ = this.store.select(selectMenteeState);

  cancelSubscription(): void {
    this.store.dispatch(MenteeActions.cancelSubscription());
  }

  requestMentorship(mentorId: string, plan: string, message: string): void {
    this.store.dispatch(MenteeActions.requestMentorship({ mentorId, plan, message }));
  }

  cancelMentorshipRequest(mentorId: string): void {
    this.store.dispatch(MenteeActions.cancelMentorshipRequest({ mentorId }));
  }
}
