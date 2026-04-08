import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import type { MentorshipSubscription } from '../models/dashboard.model';
import { SubscriptionsActions } from '../../store/subscriptions/subscriptions.actions';
import { selectAllSubscriptions } from '../../store/subscriptions/subscriptions.selectors';

@Injectable({ providedIn: 'root' })
export class SubscriptionsFacade {
  private readonly store = inject(Store);

  readonly all$ = this.store.select(selectAllSubscriptions);

  forMentee$(menteeId: string) {
    return this.all$.pipe(map((items) => items.filter((s) => s.menteeId === menteeId)));
  }

  forMentor$(mentorId: string) {
    return this.all$.pipe(map((items) => items.filter((s) => s.mentorId === mentorId)));
  }

  pendingVerification$() {
    return this.all$.pipe(map((items) => items.filter((s) => s.status === 'payment_submitted')));
  }

  add(subscription: MentorshipSubscription): void {
    this.store.dispatch(SubscriptionsActions.addSubscription({ subscription }));
  }

  confirmPayment(subscriptionId: string, transferRef?: string): void {
    this.store.dispatch(SubscriptionsActions.confirmPayment({ subscriptionId, transferRef }));
  }

  activateSubscription(subscriptionId: string): void {
    this.store.dispatch(SubscriptionsActions.activateSubscription({ subscriptionId }));
  }

  rejectPayment(subscriptionId: string): void {
    this.store.dispatch(SubscriptionsActions.rejectPayment({ subscriptionId }));
  }
}
