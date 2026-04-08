import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { MentorPayoutAccount, MenteeListStatus } from '../models/dashboard.model';
import { MentorActions } from '../../store/mentor/mentor.actions';
import type { MentorState } from '../../store/mentor/mentor.reducer';
import { selectMentorState } from '../../store/mentor/mentor.selectors';

@Injectable({ providedIn: 'root' })
export class MentorFacade {
  private readonly store = inject(Store);

  readonly data$ = this.store.select(selectMentorState);

  /** Synchronous snapshot for templates/handlers that expect `.data`. */
  get data(): MentorState {
    let d: MentorState | undefined;
    this.data$.subscribe((x) => (d = x)).unsubscribe();
    return d!;
  }

  setAcceptingNewMentees(accepting: boolean): void {
    this.store.dispatch(MentorActions.setAcceptingNewMentees({ accepting }));
  }

  setPayoutAccount(account: MentorPayoutAccount): void {
    this.store.dispatch(MentorActions.setPayoutAccount({ account }));
  }

  acceptRequest(requestId: number): void {
    this.store.dispatch(MentorActions.acceptRequest({ requestId }));
  }

  declineRequest(requestId: number): void {
    this.store.dispatch(MentorActions.declineRequest({ requestId }));
  }

  acceptMentee(menteeId: number): void {
    this.store.dispatch(MentorActions.acceptMentee({ menteeId }));
  }

  removeMentee(menteeId: number): void {
    this.store.dispatch(MentorActions.removeMentee({ menteeId }));
  }

  markMenteeCompleted(menteeId: number): void {
    this.store.dispatch(MentorActions.markMenteeCompleted({ menteeId }));
  }

  updateMenteeStatus(menteeId: number, status: MenteeListStatus, subscriptionId?: string, amount?: number): void {
    this.store.dispatch(MentorActions.updateMenteeStatus({ menteeId, status, subscriptionId, amount }));
  }
}
