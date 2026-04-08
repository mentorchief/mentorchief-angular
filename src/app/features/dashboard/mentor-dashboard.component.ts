import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { combineLatest, map } from 'rxjs';
import { AuthFacade } from '../../core/facades/auth.facade';
import { MentorFacade } from '../../core/facades/mentor.facade';
import { ReportsFacade } from '../../core/facades/reports.facade';
import { MessagingFacade } from '../../core/facades/messaging.facade';
import type { MenteeListItem } from '../../core/models/dashboard.model';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
export interface UnifiedPendingItem { id: number; name: string; goalOrPlan: string; detail: string; rating: number | null; source: 'request' | 'mentee'; latestReport: { id: number; mentorName: string } | null; }
import { ROUTES } from '../../core/routes';
import type { User } from '../../core/models/user.model';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'mc-mentor-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl lg:text-3xl text-gray-900 font-bold">Mentor Dashboard</h1>
          <p class="text-gray-500 mt-1">Manage your mentees and track your earnings.</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        @for (stat of (mentorStatsWithRating$ | async) ?? []; track stat.label) {
          <div class="bg-white rounded-lg border border-gray-200 p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-md flex items-center justify-center" [class]="stat.bgColor">
                <fa-icon [icon]="stat.icon" [class]="stat.textColor" class="w-5 h-5" />
              </div>
              <fa-icon [icon]="['fas', 'chart-line']" class="text-green-500 w-4 h-4" />
            </div>
            <div class="text-2xl text-gray-900 font-bold">{{ stat.value }}</div>
            <div class="text-gray-500 text-sm">{{ stat.label }}</div>
          </div>
        }
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Pending Requests -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <h3 class="text-gray-900 font-medium">Pending Requests</h3>
                <span class="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">{{ (allPending$ | async)?.length ?? 0 }} new</span>
              </div>
            </div>
            <div class="space-y-3">
              @for (item of displayedPending; track item.id + item.source) {
                <div class="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div class="flex items-start justify-between mb-2">
                    <div class="text-gray-900 text-sm font-medium">{{ item.name }}</div>
                    @if (item.rating != null) {
                    <div class="flex items-center gap-1">
                      <fa-icon [icon]="['fas', 'star']" class="text-amber-400 w-4 h-4" />
                      <span class="text-sm text-gray-900">{{ item.rating }}</span>
                    </div>
                  }
                  </div>
                  <p class="text-sm text-gray-500 mb-1">{{ item.goalOrPlan }}</p>
                  <p class="text-sm text-gray-500 mb-3">{{ item.detail }}</p>
                  @if (item.latestReport) {
                    <div class="mb-3">
                      <a
                        [routerLink]="ROUTES.mentor.reportView(item.latestReport.id)"
                        class="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        <fa-icon [icon]="['fas', 'file-lines']" class="w-3.5 h-3.5" />
                        View latest report from {{ item.latestReport.mentorName }}
                      </a>
                    </div>
                  }
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="onAccept(item)"
                      class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:opacity-90"
                    >
                      <fa-icon [icon]="['fas', 'check']" class="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      type="button"
                      (click)="onDecline(item)"
                      class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
                    >
                      <fa-icon [icon]="['fas', 'xmark']" class="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              }
              @if (((allPending$ | async)?.length ?? 0) > 5) {
                <a routerLink="/dashboard/mentor/my-mentees" class="block text-center text-sm text-indigo-600 hover:text-indigo-700 mt-2 no-underline">See more →</a>
              }
            </div>
          </div>

          <!-- Active Mentees -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-gray-900 font-medium">Active Mentees</h3>
              <span class="text-gray-500 text-sm">{{ (activeMentees$ | async)?.length ?? 0 }} mentees</span>
            </div>
            <div class="space-y-4">
              @for (mentee of displayedMentees; track mentee.id) {
                <div class="flex items-center gap-4">
                  <div class="relative">
                    <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                      {{ getInitials(mentee.name) }}
                    </div>
                    @if (mentee.unreadCount && mentee.unreadCount > 0) {
                      <span class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-indigo-600 text-white text-xs font-medium rounded-full">
                        {{ mentee.unreadCount > 99 ? '99+' : mentee.unreadCount }}
                      </span>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <div class="text-gray-900 text-sm font-medium">{{ mentee.name }}</div>
                      <div class="text-gray-500 text-xs">{{ mentee.startDate }}</div>
                    </div>
                    <div class="text-gray-500 text-xs mt-0.5">{{ mentee.plan }}</div>
                  </div>
                  <a
                    [routerLink]="ROUTES.mentor.messages"
                    [queryParams]="{ mentee: mentee.name }"
                    class="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors no-underline"
                  >
                    Message
                  </a>
                </div>
              }
              @if (((activeMentees$ | async)?.length ?? 0) > 5) {
                <a routerLink="/dashboard/mentor/my-mentees" class="block text-center text-sm text-indigo-600 hover:text-indigo-700 mt-2 no-underline">See more →</a>
              }
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Earnings -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="flex items-center gap-2 mb-4">
              <fa-icon [icon]="['fas', 'shield-halved']" class="text-indigo-600 w-4 h-4" />
              <h3 class="text-gray-900 font-medium">Earnings Overview</h3>
            </div>
            <div class="space-y-3">
              @for (earning of displayedEarnings; track earning.month) {
                <div class="p-3 rounded-md border border-gray-200">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm text-gray-900">{{ earning.month }}</span>
                    <span
                      [class]="earning.status === 'In Escrow' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'"
                      class="text-xs px-2 py-0.5 rounded-md"
                    >
                      {{ earning.status }}
                    </span>
                  </div>
                  <div class="text-xl text-gray-900 font-bold">\${{ earning.amount | number }}</div>
                  <div class="text-gray-500 text-xs">From {{ earning.mentees }} mentees</div>
                </div>
              }
              @if (((earnings$ | async)?.length ?? 0) > 3) {
                <a routerLink="/dashboard/mentor/earnings" class="block text-center text-sm text-indigo-600 hover:text-indigo-700 mt-2 no-underline">See more →</a>
              }
            </div>
            <div class="mt-4 pt-4 border-t border-gray-200">
              <div class="flex items-center justify-between">
                <span class="text-gray-500 text-sm">Total Earned</span>
                <span class="text-gray-900 text-lg font-bold">\${{ ((totalEarned$ | async) ?? 0) | number }}</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-gray-900 font-medium mb-4">Quick Actions</h3>
            <div class="space-y-2">
              <a
                routerLink="/dashboard/mentor/messages"
                class="w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 transition-colors no-underline"
              >
                <div class="w-9 h-9 rounded-md flex items-center justify-center bg-purple-50 text-purple-600"><fa-icon [icon]="['fas', 'message']" class="w-4 h-4" /></div>
                <span class="text-gray-900 text-sm">View Messages</span>
                <span class="ml-auto text-gray-400">→</span>
              </a>
              <a
                routerLink="/dashboard/mentor/earnings"
                class="w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 transition-colors no-underline"
              >
                <div class="w-9 h-9 rounded-md flex items-center justify-center bg-green-50 text-green-600"><fa-icon [icon]="['fas', 'wallet']" class="w-4 h-4" /></div>
                <span class="text-gray-900 text-sm">Payment Settings</span>
                <span class="ml-auto text-gray-400">→</span>
              </a>
              <a
                routerLink="/dashboard/mentor/settings"
                class="w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 transition-colors no-underline"
              >
                <div class="w-9 h-9 rounded-md flex items-center justify-center bg-blue-50 text-blue-600"><fa-icon [icon]="['fas', 'gear']" class="w-4 h-4" /></div>
                <span class="text-gray-900 text-sm">Profile Settings</span>
                <span class="ml-auto text-gray-400">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorDashboardComponent {
  private readonly authSvc = inject(AuthFacade);
  private readonly mentorData = inject(MentorFacade);
  private readonly reportsSvc = inject(ReportsFacade);
  private readonly messagingSvc = inject(MessagingFacade);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly ROUTES = ROUTES;
  readonly user$ = this.authSvc.currentUser$;
  readonly activeMentees$ = combineLatest([
    this.mentorData.data$,
    this.messagingSvc.conversations$,
    this.user$,
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
  readonly mentorStats$ = combineLatest([this.mentorData.data$, this.activeMentees$]).pipe(map(([d, activeMentees]) => [
    { label: 'Active Mentees', value: String(activeMentees.length), icon: ['fas','users'] as IconProp, bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { label: 'Monthly Revenue', value: '$' + (d.earnings[0]?.amount ?? 0).toLocaleString(), icon: ['fas','dollar-sign'] as IconProp, bgColor: 'bg-green-50', textColor: 'text-green-600' },
    { label: 'Total Earned', value: '$' + d.earnings.reduce((s,e) => s+e.amount,0).toLocaleString(), icon: ['fas','wallet'] as IconProp, bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    { label: 'Avg. Rating', value: '0.0', icon: ['fas','star'] as IconProp, bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
  ]));
  readonly mentorStatsWithRating$ = combineLatest([
    this.mentorStats$,
    this.user$,
    this.reportsSvc.mentorProfileReviews$,
  ]).pipe(
    map(([stats, user, reviews]) => {
      const mine = user ? reviews.filter((r) => r.mentorId === user.id) : [];
      const avg = mine.length ? mine.reduce((s, r) => s + r.rating, 0) / mine.length : 0;
      return stats.map((stat) =>
        stat.label === 'Avg. Rating' ? { ...stat, value: avg.toFixed(1) } : stat,
      );
    }),
  );
  readonly allPending$ = this.mentorData.data$.pipe(map((d): UnifiedPendingItem[] => [
    ...d.pendingRequests.map((r) => ({ id: r.id, name: r.name, goalOrPlan: r.goal, detail: r.message, rating: r.rating, source: 'request' as const, latestReport: null })),
    ...d.myMentees.filter((m) => m.status === 'pending').map((m) => ({ id: m.id, name: m.name, goalOrPlan: m.plan, detail: m.email, rating: null, source: 'mentee' as const, latestReport: null })),
  ]));
  readonly activeMenteesWithUnread$ = combineLatest([this.activeMentees$, this.messagingSvc.mentorUnread$]).pipe(
    map(([mentees, unread]) => {
      const user = this.authSvc.currentUser;
      const convs = user ? this.messagingSvc.getMentorConversations(user.id) : [];
      return mentees.map((m) => {
        const conv = convs.find((c) => c.menteeId === String(m.id) || c.menteeName === m.name);
        return { ...m, unreadCount: conv ? (unread[conv.id] ?? 0) : 0 };
      });
    }),
  );
  readonly earnings$ = this.mentorData.data$.pipe(map((d) => d.earnings));
  readonly totalEarned$ = this.earnings$.pipe(map((e) => e.reduce((s,x) => s+x.amount,0)));

  displayedPending: UnifiedPendingItem[] = [];
  displayedMentees: (MenteeListItem & { unreadCount: number })[] = [];
  displayedEarnings: { month: string; amount: number; status: string; mentees: number }[] = [];

  constructor() {
    this.allPending$.subscribe((items) => { this.displayedPending = items.slice(0, 5); });
    this.activeMenteesWithUnread$.subscribe((items) => { this.displayedMentees = items.slice(0, 5); });
    this.earnings$.subscribe((items) => { this.displayedEarnings = items.slice(0, 3); });
  }

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  }

  onAccept(item: UnifiedPendingItem): void {
    if (item.source === 'request') this.mentorData.acceptRequest(item.id);
    else this.mentorData.acceptMentee(item.id);
    this.toast.success(`${item.name} has been added to your mentees.`);
  }

  async onDecline(item: { id: number; name: string; source: 'request' | 'mentee' }): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({ title: 'Decline request', message: `Are you sure you want to decline ${item.name}'s mentorship request?`, confirmLabel: 'Yes, decline', cancelLabel: 'Keep request', variant: 'danger' });
    if (confirmed) {
      if (item.source === 'request') this.mentorData.declineRequest(item.id);
      else this.mentorData.removeMentee(item.id);
      this.toast.success(`Request from ${item.name} has been declined.`);
    }
  }
}
