import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { map } from 'rxjs';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ROUTES } from '../../../core/routes';
import { DEFAULT_MENTEE_CAPACITY, parseMenteeCapacity } from '../../../core/constants';
import type { MenteeListItem } from '../../../core/models/dashboard.model';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { MentorFacade } from '../../../core/facades/mentor.facade';
import { MessagingFacade } from '../../../core/facades/messaging.facade';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { ReportsFacade } from '../../../core/facades/reports.facade';
import type { MenteeReport } from '../../../core/models/dashboard.model';
import type { PendingMentorshipRequest } from '../../../core/models/dashboard.model';

export interface UnifiedPendingItem {
  id: number;
  name: string;
  goalOrPlan: string;
  detail: string;
  rating: number | null;
  source: 'request' | 'mentee';
  latestReport: (MenteeReport & { menteeName: string }) | null;
}

const ACTIVE_PAGE_SIZE = 10;

@Component({
  selector: 'mc-my-mentees-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">My Mentees</h1>
        <p class="text-muted-foreground mt-1">Manage your mentorship relationships</p>
      </div>

      <!-- Stats -->
      <div class="grid sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Active Mentees</div>
          <div class="text-2xl text-foreground font-semibold">{{ (activeMentees$ | async)?.length ?? 0 }}</div>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Pending Requests</div>
          <div class="text-2xl text-foreground font-semibold">{{ (pendingItems$ | async)?.length ?? 0 }}</div>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Capacity</div>
          <div class="text-2xl text-foreground font-semibold">{{ (activeMentees$ | async)?.length ?? 0 }}/{{ (mentorCapacity$ | async) ?? defaultCapacity }}</div>
        </div>
      </div>

      <!-- Pending Requests (same data as mentor dashboard) -->
      @if ((pendingItems$ | async)?.length) {
        <div class="mb-8">
          <h2 class="text-lg text-foreground mb-4">Pending Requests</h2>
          <div class="grid gap-4">
            @for (item of (pendingItems$ | async) ?? []; track item.id + item.source) {
              <div class="bg-card rounded-lg border border-amber-200 p-5">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span class="text-primary-foreground font-medium">{{ getInitials(item.name) }}</span>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-foreground font-medium">{{ item.name }}</h3>
                    <p class="text-muted-foreground text-sm">{{ item.detail }}</p>
                    <p class="text-muted-foreground text-xs mt-1">{{ item.source === 'request' ? 'Goal' : 'Requested' }}: {{ item.goalOrPlan }}</p>
                  </div>
                  @if (item.latestReport) {
                    <a
                      [routerLink]="ROUTES.mentor.reportView(item.latestReport.id)"
                      class="text-sm text-primary hover:underline shrink-0"
                    >
                      View latest report
                    </a>
                  }
                  <div class="flex gap-2">
                    <button
                      type="button"
                      (click)="onAcceptItem(item)"
                      class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      (click)="onDeclineItem(item)"
                      class="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-muted"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Active mentorships -->
      <div>
        <h2 class="text-lg text-foreground mb-4">Active Mentorships</h2>
        <div class="bg-card rounded-lg border border-border overflow-hidden">
          <div class="p-4 border-b border-border">
            <input
              type="text"
              [ngModel]="activeSearchQuery"
              (ngModelChange)="onActiveSearchChange($event)"
              placeholder="Search by name, email, plan..."
              class="w-full max-w-md px-4 py-2 bg-input-background border border-border rounded-md text-sm"
            />
          </div>
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentee</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Plan</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Start Date</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (mentee of activeMenteesPaginated; track mentee.id) {
                <tr class="border-b border-border last:border-0">
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                      <div class="relative">
                        <div class="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                          <span class="text-secondary-foreground text-sm font-medium">{{ getInitials(mentee.name) }}</span>
                        </div>
                        @if (getUnreadCount(mentee) > 0) {
                          <span class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium rounded-full">
                            {{ getUnreadCount(mentee) > 99 ? '99+' : getUnreadCount(mentee) }}
                          </span>
                        }
                      </div>
                      <div>
                        <p class="text-foreground text-sm font-medium">{{ mentee.name }}</p>
                        <p class="text-muted-foreground text-xs">{{ mentee.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ mentee.plan }}</td>
                  <td class="px-5 py-4">
                    <span [class]="getStatusBadgeClass(mentee.status)" class="px-2.5 py-1 rounded-md text-xs whitespace-nowrap">
                      {{ getStatusLabel(mentee.status) }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-sm text-muted-foreground">{{ mentee.startDate }}</td>
                  <td class="px-5 py-4">
                    <div class="flex flex-wrap items-center gap-2">
                      @if (mentee.status === 'active') {
                        <a
                          [routerLink]="ROUTES.mentor.messages"
                          [queryParams]="{ mentee: mentee.name }"
                          class="px-3 py-1.5 border border-border text-foreground rounded-md text-sm hover:bg-muted no-underline inline-block"
                        >
                          Message
                        </a>
                        @if (isPeriodExceeded(mentee)) {
                          <a
                            [routerLink]="['/dashboard/mentor/report', mentee.id]"
                            class="px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-xs hover:bg-amber-200 no-underline inline-block"
                          >
                            Submit report
                          </a>
                        }
                      }
                      @if (mentee.status === 'approved_awaiting_payment') {
                        <span class="text-xs text-muted-foreground">Awaiting mentee payment</span>
                      }
                      @if (mentee.status === 'payment_submitted') {
                        <span class="text-xs text-blue-700">Report and payout under admin review</span>
                        @if (latestReportForMentee(mentee.id)?.adminReviewStatus === 'rejected') {
                          <a
                            [routerLink]="['/dashboard/mentor/report', mentee.id]"
                            class="px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/30 rounded-md text-xs hover:bg-destructive/15 no-underline inline-block"
                          >
                            Resubmit report
                          </a>
                        }
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="p-4">
          <mc-pagination
            [totalItems]="activeMenteesFiltered.length"
            [pageSize]="activePageSize"
            [currentPage]="activePage"
            (pageChange)="onActivePageChange($event)"
          />
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyMenteesPageComponent implements OnInit, OnDestroy {
  private readonly mentorData = inject(MentorFacade);
  private readonly messaging = inject(MessagingFacade);
  private readonly auth = inject(AuthFacade);
  private readonly reports = inject(ReportsFacade);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly ROUTES = ROUTES;
  readonly defaultCapacity = DEFAULT_MENTEE_CAPACITY;

  readonly activeMentees$ = combineLatest([
    this.mentorData.data$,
    this.messaging.conversations$,
    this.auth.currentUser$,
  ]).pipe(
    map(([d, convs, user]) => {
      const mentorConvs = user ? convs.filter((c) => c.mentorId === user.id && c.status === 'active') : [];
      const byId = new Map(d.myMentees.map((m) => [String(m.id), m] as const));
      const seen = new Set<string>();
      const list: MenteeListItem[] = [];
      for (const c of mentorConvs) {
        if (seen.has(c.menteeId)) continue;
        seen.add(c.menteeId);
        const seed = byId.get(c.menteeId);
        list.push({
          id: Number(c.menteeId) || seed?.id || 0,
          name: c.menteeName,
          avatar: seed?.avatar ?? '',
          email: seed?.email ?? '',
          plan: c.subscription?.planName ?? seed?.plan ?? 'Monthly',
          startDate: c.subscription?.startDate ?? seed?.startDate ?? '-',
          progress: seed?.progress ?? 0,
          status: 'active',
          subscriptionId: seed?.subscriptionId,
          amount: c.subscription?.amount ?? seed?.amount,
        });
      }
      return list;
    }),
  );
  readonly mentorCapacity$ = this.auth.currentUser$.pipe(map((u) => parseMenteeCapacity(u?.menteeCapacity)));

  readonly pendingItems$ = combineLatest([
    this.mentorData.data$,
    this.reports.menteeReports$,
  ]).pipe(map(([d, allReports]) => {
    const reportsWithName = allReports.map((r) => ({
      ...r,
      menteeName: d.myMentees.find((m) => String(m.id) === r.menteeId)?.name ?? `Mentee #${r.menteeId}`,
    }));
    const fromRequests: UnifiedPendingItem[] = d.pendingRequests.map((req) => {
      const menteeReports = reportsWithName
        .filter((r) => r.menteeName === req.name)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { id: req.id, name: req.name, goalOrPlan: req.goal, detail: req.message, rating: req.rating, source: 'request' as const, latestReport: menteeReports[0] ?? null };
    });
    const fromMentees: UnifiedPendingItem[] = d.myMentees.filter((m) => m.status === 'pending').map((m) => {
      const menteeReports = reportsWithName
        .filter((r) => r.menteeName === m.name)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { id: m.id, name: m.name, goalOrPlan: m.plan, detail: m.email, rating: null, source: 'mentee' as const, latestReport: menteeReports[0] ?? null };
    });
    return [...fromRequests, ...fromMentees];
  }));

  readonly unreadCounts$ = combineLatest([
    this.messaging.conversations$,
    this.messaging.mentorUnread$,
    this.auth.currentUser$,
  ]).pipe(map(([convs, unreadByConv, user]) => {
    const byId: Record<number, number> = {};
    const byName: Record<string, number> = {};
    const mentorConvs = user ? convs.filter((c) => c.mentorId === user.id) : [];
    for (const c of mentorConvs) {
      const count = unreadByConv[c.id] ?? 0;
      byId[Number(c.menteeId)] = count;
      byName[c.menteeName] = count;
    }
    return { byId, byName };
  }));

  activeMenteesList: MenteeListItem[] = [];
  unreadCounts: { byId: Record<number, number>; byName: Record<string, number> } = { byId: {}, byName: {} };
  allReports: MenteeReport[] = [];
  activeSearchQuery = '';
  readonly activePageSize = ACTIVE_PAGE_SIZE;
  activePage = 1;

  ngOnInit(): void {
    this.activeMentees$.pipe(takeUntil(this.destroy$)).subscribe((list) => {
      this.activeMenteesList = list;
      this.cdr.markForCheck();
    });
    this.unreadCounts$.pipe(takeUntil(this.destroy$)).subscribe((u) => {
      this.unreadCounts = u;
      this.cdr.markForCheck();
    });
    this.reports.menteeReports$.pipe(takeUntil(this.destroy$)).subscribe((list) => {
      this.allReports = list;
      this.cdr.markForCheck();
    });
  }

  getUnreadCount(mentee: MenteeListItem): number {
    return this.unreadCounts.byId[mentee.id] ?? this.unreadCounts.byName[mentee.name] ?? 0;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get activeMenteesFiltered(): MenteeListItem[] {
    const list = this.activeMenteesList;
    const q = this.activeSearchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter((m) =>
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.plan.toLowerCase().includes(q)
    );
  }

  get activeMenteesPaginated(): MenteeListItem[] {
    const list = this.activeMenteesFiltered;
    const start = (this.activePage - 1) * this.activePageSize;
    return list.slice(start, start + this.activePageSize);
  }

  onActiveSearchChange(value: string): void {
    this.activeSearchQuery = value;
    this.activePage = 1;
    this.cdr.markForCheck();
  }

  onActivePageChange(page: number): void {
    this.activePage = page;
    this.cdr.markForCheck();
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'approved_awaiting_payment': return 'Awaiting Payment';
      case 'payment_submitted': return 'Payment Submitted';
      case 'completed': return 'Completed';
      default: return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'approved_awaiting_payment': return 'bg-amber-100 text-amber-700';
      case 'payment_submitted': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  }

  latestReportForMentee(menteeId: number): MenteeReport | null {
    const matches = this.allReports
      .filter((r) => Number(r.menteeId) === menteeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return matches[0] ?? null;
  }

  /** True if the mentorship plan period (e.g. 1 month for Monthly, 3 for Quarterly) has ended. */
  isPeriodExceeded(mentee: MenteeListItem): boolean {
    const start = new Date(mentee.startDate);
    if (Number.isNaN(start.getTime())) return false;
    const months = mentee.plan.toLowerCase().includes('quarter') ? 3 : 1;
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return new Date() >= end;
  }

  onAcceptItem(item: UnifiedPendingItem): void {
    if (item.source === 'request') {
      this.mentorData.acceptRequest(item.id);
    } else {
      this.mentorData.acceptMentee(item.id);
    }
    this.toast.success(`${item.name} has been added to your mentees.`);
  }

  async onDeclineItem(item: UnifiedPendingItem): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Decline request',
      message: `Are you sure you want to decline ${item.name}'s mentorship request? They will be notified.`,
      confirmLabel: 'Yes, decline',
      cancelLabel: 'Keep request',
      variant: 'danger',
    });
    if (confirmed) {
      if (item.source === 'request') {
        this.mentorData.declineRequest(item.id);
      } else {
        this.mentorData.removeMentee(item.id);
      }
      this.toast.success(`Request from ${item.name} has been declined.`);
    }
  }
}
