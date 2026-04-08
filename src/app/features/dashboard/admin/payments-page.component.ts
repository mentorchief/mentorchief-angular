import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { map } from 'rxjs';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import type { AdminPayment, MentorshipSubscription } from '../../../core/models/dashboard.model';
import { AdminFacade } from '../../../core/facades/admin.facade';
import { SubscriptionsFacade } from '../../../core/facades/subscriptions.facade';
import { MentorFacade } from '../../../core/facades/mentor.facade';
import { NotificationsFacade } from '../../../core/facades/notifications.facade';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'mc-admin-payments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">Payments</h1>
        <p class="text-muted-foreground mt-1">Monitor platform transactions</p>
      </div>

      <!-- Summary Cards -->
      <div class="grid sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Total Volume</div>
          <div class="text-2xl text-foreground font-semibold">\${{ totalVolume.toLocaleString() }}</div>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">In Escrow</div>
          <div class="text-2xl text-foreground font-semibold">\${{ inEscrow.toLocaleString() }}</div>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Platform Fees</div>
          <div class="text-2xl text-foreground font-semibold">\${{ platformFees.toLocaleString() }}</div>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Disputes</div>
          <div class="text-2xl text-foreground font-semibold">{{ disputes }}</div>
        </div>
      </div>

      <!-- Pending Payment Verification -->
      @if (pendingVerification.length > 0) {
        <div class="bg-card rounded-lg border-2 border-amber-300 p-6 mb-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <span class="text-amber-600 text-sm font-bold">{{ pendingVerification.length }}</span>
            </div>
            <h2 class="text-lg text-foreground font-medium">Pending Payment Verification</h2>
          </div>
          <div class="space-y-3">
            @for (sub of pendingVerification; track sub.id) {
              <div class="p-4 bg-amber-50/50 border border-amber-200 rounded-lg">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p class="text-foreground text-sm font-medium">{{ sub.menteeName }} → {{ sub.mentorName }}</p>
                    <p class="text-muted-foreground text-xs mt-0.5">
                      Subscription: <span class="font-mono">{{ sub.id }}</span>
                      · Plan: {{ sub.plan }}
                      · Amount: <strong>\${{ sub.amount }}</strong>
                    </p>
                    @if (sub.transferRef) {
                      <p class="text-muted-foreground text-xs mt-0.5">Transfer Ref: <span class="font-mono text-foreground">{{ sub.transferRef }}</span></p>
                    }
                    @if (sub.paymentConfirmedAt) {
                      <p class="text-muted-foreground text-xs mt-0.5">Payment confirmed: {{ sub.paymentConfirmedAt | date:'medium' }}</p>
                    }
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      (click)="onActivateSubscription(sub)"
                      class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    >
                      Activate
                    </button>
                    <button
                      type="button"
                      (click)="onRejectPayment(sub)"
                      class="px-4 py-2 border border-destructive text-destructive rounded-md text-sm hover:bg-destructive/5"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="bg-card rounded-lg border border-border p-4 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <input
            type="text"
            [ngModel]="searchQuery"
            (ngModelChange)="onSearchQueryChange($event)"
            placeholder="Search by ID, mentee, mentor..."
            class="flex-1 min-w-[200px] px-4 py-2 bg-input-background border border-border rounded-md"
          />
          <select
            [ngModel]="filterStatus"
            (ngModelChange)="onFilterStatusChange($event)"
            class="px-4 py-2 bg-input-background border border-border rounded-md"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_escrow">In Escrow</option>
            <option value="disputed">Disputed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <!-- Payments Table -->
      <div class="bg-card rounded-lg border border-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">ID</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Date</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentee</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentor</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Amount</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (payment of paginatedPayments; track payment.id) {
                <tr class="border-b border-border last:border-0 hover:bg-muted/30">
                  <td class="px-5 py-4 text-sm text-muted-foreground font-mono">#{{ payment.id }}</td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ payment.date }}</td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ payment.mentee }}</td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ payment.mentor }}</td>
                  <td class="px-5 py-4 text-sm text-foreground font-medium">\${{ payment.amount }}</td>
                  <td class="px-5 py-4">
                    <span [class]="getStatusClass(payment.status)" class="px-2.5 py-1 rounded-md text-xs">
                      {{ getStatusLabel(payment.status) }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="p-4">
          <mc-pagination
            [totalItems]="filteredPayments.length"
            [pageSize]="pageSize"
            [currentPage]="currentPage"
            (pageChange)="onPageChange($event)"
          />
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPaymentsPageComponent implements OnInit, OnDestroy {
  private readonly adminData = inject(AdminFacade);
  private readonly subsFacade = inject(SubscriptionsFacade);
  private readonly mentorFacade = inject(MentorFacade);
  private readonly notifFacade = inject(NotificationsFacade);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  paymentsList: AdminPayment[] = [];
  pendingVerification: MentorshipSubscription[] = [];
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;
  searchQuery = '';
  filterStatus = '';

  ngOnInit(): void {
    this.adminData.data$.pipe(map((d) => d.payments), takeUntil(this.destroy$)).subscribe((list) => {
      this.paymentsList = list;
      this.cdr.markForCheck();
    });
    this.subsFacade.pendingVerification$().pipe(takeUntil(this.destroy$)).subscribe((list) => {
      this.pendingVerification = list;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredPayments(): AdminPayment[] {
    const q = this.searchQuery.toLowerCase().trim();
    const status = this.filterStatus;
    return this.paymentsList.filter((p) => {
      const matchSearch = !q || p.id.toLowerCase().includes(q) || p.mentee.toLowerCase().includes(q) || p.mentor.toLowerCase().includes(q);
      const matchStatus = !status || p.status === status;
      return matchSearch && matchStatus;
    });
  }

  get paginatedPayments(): AdminPayment[] {
    const list = this.filteredPayments;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  onFilterStatusChange(value: string): void {
    this.filterStatus = value;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.cdr.markForCheck();
  }

  get totalVolume(): number {
    return this.paymentsList.reduce((sum, p) => sum + p.amount, 0);
  }

  get inEscrow(): number {
    return this.paymentsList.filter(p => p.status === 'in_escrow').reduce((sum, p) => sum + p.amount, 0);
  }

  get platformFees(): number {
    return Math.round(this.totalVolume * 0.1);
  }

  get disputes(): number {
    return this.paymentsList.filter(p => p.status === 'disputed').length;
  }

  getStatusClass(status: AdminPayment['status']): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_escrow': return 'bg-amber-100 text-amber-700';
      case 'disputed': return 'bg-destructive/10 text-destructive';
      case 'refunded': return 'bg-muted text-muted-foreground';
      case 'pending_verification': return 'bg-blue-100 text-blue-700';
      default: return 'bg-muted text-muted-foreground';
    }
  }

  getStatusLabel(status: AdminPayment['status']): string {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_escrow': return 'In Escrow';
      case 'disputed': return 'Disputed';
      case 'refunded': return 'Refunded';
      case 'pending_verification': return 'Pending Verification';
    }
  }

  async onActivateSubscription(sub: MentorshipSubscription): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Activate Subscription',
      message: `Confirm that the payment of $${sub.amount} from ${sub.menteeName} has been received. This will activate the mentorship with ${sub.mentorName}.`,
      confirmLabel: 'Yes, Activate',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    this.subsFacade.activateSubscription(sub.id);
    this.mentorFacade.updateMenteeStatus(Number(sub.menteeId), 'active', sub.id, sub.amount);

    this.notifFacade.add({
      id: `notif-activated-${Date.now()}`,
      userId: sub.menteeId,
      type: 'subscription_activated',
      title: 'Subscription Activated!',
      message: `Your mentorship with ${sub.mentorName} is now active. Start by sending a message!`,
      subscriptionId: sub.id,
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.toast.success(`Subscription for ${sub.menteeName} with ${sub.mentorName} has been activated.`);
    this.cdr.markForCheck();
  }

  async onRejectPayment(sub: MentorshipSubscription): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Reject Payment',
      message: `Reject the payment from ${sub.menteeName}? The subscription will revert to awaiting payment and a new WhatsApp link will be available.`,
      confirmLabel: 'Yes, Reject',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    this.subsFacade.rejectPayment(sub.id);
    this.mentorFacade.updateMenteeStatus(Number(sub.menteeId), 'approved_awaiting_payment', sub.id, sub.amount);

    this.notifFacade.add({
      id: `notif-rejected-${Date.now()}`,
      userId: sub.menteeId,
      type: 'payment_rejected',
      title: 'Payment Not Verified',
      message: `Your payment for the mentorship with ${sub.mentorName} could not be verified. Please check the payment details and try again.`,
      subscriptionId: sub.id,
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.toast.success(`Payment from ${sub.menteeName} has been rejected. Mentee has been notified.`);
    this.cdr.markForCheck();
  }
}
