import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import { switchMap, withLatestFrom } from 'rxjs/operators';
import { MentorActions } from '../mentor/mentor.actions';
import { SubscriptionsActions } from '../subscriptions/subscriptions.actions';
import { NotificationsActions } from '../notifications/notifications.actions';
import { ReportsActions } from '../reports/reports.actions';
import { selectCurrentUser } from '../auth/auth.selectors';
import { selectMentorState } from '../mentor/mentor.selectors';
import { selectPlatformState } from '../platform/platform.selectors';
import { selectSubscriptionsState } from '../subscriptions/subscriptions.selectors';
import { selectMenteeReports } from '../reports/reports.selectors';
import type { MentorshipSubscription, AppNotification } from '../../core/models/dashboard.model';
import { MENTORS } from '../../core/data/mentors.data';

function generateSubscriptionId(mentorId: string, menteeId: string): string {
  return `SUB-${mentorId}-${menteeId}-${Date.now()}`;
}

function buildWhatsAppLink(
  whatsappNumber: string,
  subscriptionId: string,
  mentorName: string,
  amount: number,
  instapayId: string,
  bankName: string,
  bankAccount: string,
  bankHolder: string,
): string {
  const lines = [
    'Payment for MentorChief Subscription',
    `Subscription ID: ${subscriptionId}`,
    `Mentor: ${mentorName}`,
    `Amount: $${amount}`,
    '',
    'Please transfer to:',
    `Instapay: ${instapayId}`,
    `or Bank: ${bankName} - ${bankAccount} (${bankHolder})`,
  ];
  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${whatsappNumber}?text=${text}`;
}

@Injectable()
export class SubscriptionEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);

  /**
   * When mentor accepts a request, create a subscription record and
   * send a notification to the mentee with a WhatsApp payment link.
   */
  readonly onRequestAccepted$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MentorActions.acceptRequest),
      withLatestFrom(
        this.store.select(selectCurrentUser),
        this.store.select(selectMentorState),
        this.store.select(selectPlatformState),
      ),
      switchMap(([{ requestId }, mentorUser, mentorState, platform]) => {
        if (!mentorUser) return EMPTY;

        const allMentees = mentorState.myMentees;
        const justAdded = allMentees.find(
          (m) => m.status === 'approved_awaiting_payment' && !m.subscriptionId,
        );
        if (!justAdded) return EMPTY;

        const menteeId = String(justAdded.id);
        const mentorId = mentorUser.id;

        const mentorProfile = MENTORS.find((m) => m.name === mentorUser.name);
        const amount = mentorProfile?.price ?? platform.samplePrice;
        const mentorName = mentorUser.name;

        const subscriptionId = generateSubscriptionId(mentorId, menteeId);

        const subscription: MentorshipSubscription = {
          id: subscriptionId,
          menteeId,
          menteeName: justAdded.name,
          mentorId,
          mentorName,
          plan: justAdded.plan || 'Monthly',
          amount,
          status: 'approved_awaiting_payment',
          createdAt: new Date().toISOString(),
          linkUsed: false,
        };

        const paymentCfg = platform.payment;
        const whatsappLink = buildWhatsAppLink(
          paymentCfg.whatsappNumber,
          subscriptionId,
          mentorName,
          amount,
          paymentCfg.instapayId,
          paymentCfg.bankName,
          paymentCfg.bankAccountNumber,
          paymentCfg.bankAccountHolder,
        );

        const notification: AppNotification = {
          id: `notif-${Date.now()}`,
          userId: menteeId,
          type: 'mentorship_approved',
          title: 'Mentorship Approved!',
          message: `${mentorName} has approved your mentorship request. Complete your payment of $${amount} to activate the subscription.`,
          whatsappLink,
          subscriptionId,
          read: false,
          createdAt: new Date().toISOString(),
        };

        return of(
          MentorActions.updateMenteeStatus({ menteeId: justAdded.id, status: 'approved_awaiting_payment', subscriptionId, amount }),
          SubscriptionsActions.addSubscription({ subscription }),
          NotificationsActions.addNotification({ notification }),
        );
      }),
    ),
  );

  /**
   * When mentee confirms payment, update the mentor's view of the mentee status.
   */
  readonly onPaymentConfirmed$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SubscriptionsActions.confirmPayment),
      withLatestFrom(
        this.store.select(selectCurrentUser),
        this.store.select(selectSubscriptionsState),
      ),
      switchMap(([{ subscriptionId }, _user, subsState]) => {
        const sub = subsState.items.find((s) => s.id === subscriptionId);
        if (!sub) return EMPTY;
        return of(
          MentorActions.updateMenteeStatus({
            menteeId: Number(sub.menteeId),
            status: 'payment_submitted',
            subscriptionId,
            amount: sub.amount,
          }),
        );
      }),
    ),
  );

  /** Mark subscription as report_submitted when mentor submits final report. */
  readonly onReportSubmitted$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.addMenteeReport),
      switchMap(({ report }) => {
        const subscriptionId = (report as { subscriptionId?: string }).subscriptionId;
        if (!subscriptionId) return EMPTY;
        return of(SubscriptionsActions.submitReport({ subscriptionId }));
      }),
    ),
  );

  /** Approving a report unlocks payout and closes the mentorship lifecycle. */
  readonly onReportApproved$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.reviewMenteeReport),
      withLatestFrom(this.store.select(selectMenteeReports)),
      switchMap(([{ reportId, status }, reports]) => {
        if (status !== 'approved') return EMPTY;
        const report = reports.find((r) => r.id === reportId) as (typeof reports[number] & { subscriptionId?: string }) | undefined;
        const subscriptionId = report?.subscriptionId;
        if (!subscriptionId) return EMPTY;
        return of(
          SubscriptionsActions.approveReport({ subscriptionId }),
          SubscriptionsActions.completeSubscription({ subscriptionId }),
        );
      }),
    ),
  );
}
