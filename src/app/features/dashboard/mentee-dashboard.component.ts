import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { Subject, take } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import type { AppState } from '../../store/app.state';
import { selectAuthUser } from '../auth/store/auth.selectors';
import {
  selectActiveMentorship,
  selectMenteeSubscription,
  selectMenteePayments,
  selectCanCancelSubscriptionForRefund,
} from './store/dashboard.selectors';
import { cancelMenteeSubscription } from './store/dashboard.actions';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  selector: 'mc-mentee-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl lg:text-3xl text-foreground">Mentee Dashboard</h1>
          <p class="text-muted-foreground mt-1">Welcome back!</p>
        </div>
        <a
          routerLink="/browse"
          class="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm no-underline"
        >
          <fa-icon [icon]="['fas', 'magnifying-glass']" class="w-4 h-4" /> Find Mentors
        </a>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Active Mentorship -->
          <div class="bg-card rounded-lg border border-border p-6">
            <h3 class="text-foreground font-medium mb-4">Active Mentorship</h3>
            @if (activeMentorship$ | async; as m) {
              <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
                <img [src]="m.mentorImage" [alt]="m.mentorName" class="w-14 h-14 rounded-lg object-cover" />
                <div class="flex-1">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <h4 class="text-foreground font-medium">{{ m.mentorName }}</h4>
                      <p class="text-muted-foreground text-sm">{{ m.mentorTitle }} at {{ m.mentorCompany }}</p>
                    </div>
                    <a [routerLink]="['/mentor', m.mentorId]" class="text-primary text-sm no-underline hover:underline whitespace-nowrap">
                      View Profile →
                    </a>
                  </div>

                  <div class="mt-4 flex flex-wrap gap-3">
                    <a
                      routerLink="/dashboard/mentee/messages"
                      class="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs sm:text-sm no-underline hover:opacity-90"
                    >
                      <fa-icon [icon]="['fas', 'message']" class="w-3.5 h-3.5" /> Go to messages
                    </a>
                  </div>
                </div>
              </div>
            } @else {
              <p class="text-muted-foreground text-sm">
                You don’t have an active mentorship yet.
                <a routerLink="/browse" class="text-primary no-underline hover:underline">Find a mentor</a>
                to start your first subscription.
              </p>
            }
          </div>

          <!-- Subscription Status -->
          <div class="bg-card rounded-lg border border-border p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-foreground font-medium">Subscription Status</h3>
              @if (subscription$ | async; as sub) {
                <span class="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full">{{ sub.status === 'active' ? 'Active' : sub.status }}</span>
              }
            </div>
            <div class="space-y-4">
              @if (subscription$ | async; as sub) {
                <div class="flex items-center justify-between p-4 bg-muted/50 rounded-md border border-border">
                  <div>
                    <div class="text-foreground text-sm font-medium">{{ sub.planName }}</div>
                    <div class="text-muted-foreground text-xs mt-1">Valid until: {{ sub.nextBillingDate }}</div>
                    <div class="text-muted-foreground text-xs mt-0.5">No auto-renewal — renew manually before it ends.</div>
                  </div>
                  <div class="text-right">
                    <div class="text-foreground text-lg font-medium">{{ sub.currency === 'USD' ? '$' : '' }}{{ sub.amount }}</div>
                    <div class="text-muted-foreground text-xs">/month</div>
                  </div>
                </div>
              }
              <div class="flex items-start gap-3 p-3 bg-accent/50 border border-primary/10 rounded-md">
                <fa-icon [icon]="['fas', 'circle-info']" class="text-primary w-4 h-4" />
                <div class="text-sm">
                  <p class="text-foreground font-medium mb-1">3-Day Cancellation Policy</p>
                  <p class="text-muted-foreground text-xs">
                    You can cancel within the first 3 days of your mentorship and receive a full refund. Your mentor will be informed when you cancel.
                  </p>
                </div>
              </div>
              @if (subscription$ | async; as sub) {
                @if (sub.status === 'active' && (canCancelForRefund$ | async)) {
                  <div class="pt-2">
                    <button
                      type="button"
                      (click)="onCancelSubscription()"
                      class="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm hover:bg-red-100 transition-colors"
                    >
                      <fa-icon [icon]="['fas', 'circle-xmark']" class="w-4 h-4" />
                      Cancel subscription (full refund)
                    </button>
                  </div>
                }
              }
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Payment Status -->
          <div class="bg-card rounded-lg border border-border p-6">
            <h3 class="text-foreground font-medium mb-4">Payment Status</h3>
            <div class="flex items-center gap-2 mb-3">
              <fa-icon [icon]="['fas', 'shield-halved']" class="text-primary w-4 h-4" />
              <span class="text-foreground text-sm">Escrow Protected</span>
            </div>
            <div class="space-y-3">
              @for (payment of (menteePayments$ | async) ?? []; track payment.id) {
                <div
                  class="p-3 rounded-md"
                  [class.bg-amber-50]="payment.status === 'in_escrow'"
                  [class.border-amber-200]="payment.status === 'in_escrow'"
                  [class.border]="payment.status === 'in_escrow' || payment.status === 'refunded'"
                  [class.bg-green-50]="payment.status === 'released'"
                  [class.border-green-200]="payment.status === 'released'"
                  [class.bg-muted]="payment.status === 'refunded'"
                  [class.border-border]="payment.status === 'refunded'"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span
                      class="text-sm"
                      [class.text-amber-800]="payment.status === 'in_escrow'"
                      [class.text-green-800]="payment.status === 'released'"
                      [class.text-muted-foreground]="payment.status === 'refunded'"
                    >{{ payment.month }}</span>
                    <span
                      class="text-xs px-2 py-0.5 rounded-md"
                      [class.bg-amber-100]="payment.status === 'in_escrow'"
                      [class.text-amber-700]="payment.status === 'in_escrow'"
                      [class.bg-green-100]="payment.status === 'released'"
                      [class.text-green-700]="payment.status === 'released'"
                      [class.bg-muted]="payment.status === 'refunded'"
                      [class.text-muted-foreground]="payment.status === 'refunded'"
                    >{{ payment.status === 'in_escrow' ? 'In Escrow' : payment.status === 'refunded' ? 'Refunded' : 'Released' }}</span>
                  </div>
                  <div
                    class="text-lg font-medium"
                    [class.text-amber-900]="payment.status === 'in_escrow'"
                    [class.text-green-900]="payment.status === 'released'"
                    [class.text-muted-foreground]="payment.status === 'refunded'"
                  >\${{ payment.amount.toFixed(2) }}</div>
                  @if (payment.status === 'in_escrow' && payment.releaseDate) {
                    <div class="text-amber-700 text-xs">Releases {{ payment.releaseDate }}</div>
                  }
                  @if (payment.status === 'released' && payment.paidToMentor) {
                    <div class="text-green-700 text-xs flex items-center gap-1"><fa-icon [icon]="['fas', 'check']" class="w-3 h-3" /> Paid to mentor</div>
                  }
                  @if (payment.status === 'refunded') {
                    <div class="text-muted-foreground text-xs flex items-center gap-1"><fa-icon [icon]="['fas', 'rotate-left']" class="w-3 h-3" /> Full refund</div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-card rounded-lg border border-border p-6">
            <h3 class="text-foreground font-medium mb-4">Quick Actions</h3>
            <div class="space-y-2">
              <a
                routerLink="/dashboard/mentee/messages"
                class="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors no-underline"
              >
                <div class="w-9 h-9 rounded-md flex items-center justify-center bg-accent text-primary"><fa-icon [icon]="['fas', 'message']" class="w-4 h-4" /></div>
                <span class="text-foreground text-sm">Message Mentor</span>
                <span class="ml-auto text-muted-foreground">→</span>
              </a>
              <a
                routerLink="/dashboard/mentee/payments"
                class="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors no-underline"
              >
                <div class="w-9 h-9 rounded-md flex items-center justify-center bg-purple-50 text-purple-600"><fa-icon [icon]="['fas', 'credit-card']" class="w-4 h-4" /></div>
                <span class="text-foreground text-sm">View Payments</span>
                <span class="ml-auto text-muted-foreground">→</span>
              </a>
              <a
                routerLink="/dashboard/mentee/my-mentors"
                class="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors no-underline"
              >
                <div class="w-9 h-9 rounded-md flex items-center justify-center bg-amber-50 text-amber-600"><fa-icon [icon]="['fas', 'star']" class="w-4 h-4" /></div>
                <span class="text-foreground text-sm">Leave Review</span>
                <span class="ml-auto text-muted-foreground">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenteeDashboardComponent implements OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly authApi = inject(AuthApiService);
  private readonly destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  readonly user$ = this.store.select(selectAuthUser);
  readonly activeMentorship$ = this.store.select(selectActiveMentorship);
  readonly subscription$ = this.store.select(selectMenteeSubscription);
  readonly menteePayments$ = this.store.select(selectMenteePayments);
  readonly canCancelForRefund$ = this.store.select(selectCanCancelSubscriptionForRefund);

  async onCancelSubscription(): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Cancel subscription',
      message:
        'Cancel within 3 days for a full refund. Your mentor will be informed of the cancellation. Do you want to continue?',
      confirmLabel: 'Yes, cancel and get refund',
      cancelLabel: 'Keep subscription',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.store.select(selectActiveMentorship).pipe(take(1)).subscribe((mentorship) => {
      const mentorshipId = mentorship?.mentorshipId;
      if (mentorshipId) {
        this.authApi.cancelMentorship(mentorshipId).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.store.dispatch(cancelMenteeSubscription());
            this.toast.success('Subscription cancelled. You will receive a full refund. Your mentor has been informed.');
          },
          error: () => {
            this.toast.error('Failed to cancel subscription. Please try again.');
          },
        });
      } else {
        this.store.dispatch(cancelMenteeSubscription());
        this.toast.success('Subscription cancelled. You will receive a full refund. Your mentor has been informed.');
      }
    });
  }
}
