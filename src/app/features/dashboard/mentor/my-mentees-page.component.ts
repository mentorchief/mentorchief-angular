import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, debounceTime, distinctUntilChanged, take, takeUntil } from 'rxjs';
import { map } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast.service';
import { selectAllUnifiedPending, selectMenteeUnreadCounts } from '../store/dashboard.selectors';
import { selectAuthUser, selectAuthUserId } from '../../auth/store/auth.selectors';
import { ROUTES } from '../../../core/routes';
import { parseMenteeCapacity } from '../../../core/utils/mentor.utils';
import { DEFAULT_MENTEE_CAPACITY } from '../../../core/constants';
import { acceptMenteeRequest, acceptMentorshipRequest, declineMentorshipRequest, removeMenteeFromList } from '../store/dashboard.actions';
import { addConversation } from '../../../store/messaging/messaging.actions';
import { AuthApiService } from '../../../core/services/auth-api.service';
import type { UnifiedPendingItem } from '../store/dashboard.selectors';
import { PaginationComponent } from '../../../shared/components/pagination.component';

interface MenteeRow {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: string;
  startDate: string;
  status: string;
  menteeUuid: string;
  mentorshipId: string;
}

const PAGE_SIZE = 10;

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
          <div class="text-2xl text-foreground font-semibold">{{ activeTotalCount }}</div>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Pending Requests</div>
          <div class="text-2xl text-foreground font-semibold">{{ (pendingItems$ | async)?.length ?? 0 }}</div>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Capacity</div>
          <div class="text-2xl text-foreground font-semibold">{{ activeTotalCount }}/{{ (mentorCapacity$ | async) ?? defaultCapacity }}</div>
        </div>
      </div>

      <!-- Pending Requests (store-driven, small dataset) -->
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
                  @if (item.menteeUuid) {
                    <a
                      [routerLink]="['/dashboard/mentor/mentee-reports', item.menteeUuid]"
                      [queryParams]="{ name: item.name }"
                      class="text-sm text-primary hover:underline shrink-0"
                    >
                      View reports
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

      <!-- Active Mentees (BE-driven) -->
      <div>
        <h2 class="text-lg text-foreground mb-4">Active Mentees</h2>
        <div class="bg-card rounded-lg border border-border overflow-hidden">
          <div class="p-4 border-b border-border">
            <input
              type="text"
              [ngModel]="activeSearchQuery"
              (ngModelChange)="onActiveSearchChange($event)"
              placeholder="Search by name, email..."
              class="w-full max-w-md px-4 py-2 bg-input-background border border-border rounded-md text-sm"
            />
          </div>
          @if (activeLoading) {
            <div class="p-10 text-center text-muted-foreground text-sm">Loading mentees...</div>
          } @else {
            <table class="w-full">
              <thead class="bg-muted/50">
                <tr>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentee</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Plan</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Start Date</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (mentee of activeMentees; track mentee.id) {
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
                    <td class="px-5 py-4 text-sm text-muted-foreground">{{ mentee.startDate }}</td>
                    <td class="px-5 py-4">
                      <div class="flex flex-wrap items-center gap-2">
                        <a
                          [routerLink]="ROUTES.mentor.messages"
                          [queryParams]="{ mentee: mentee.name }"
                          class="px-3 py-1.5 border border-border text-foreground rounded-md text-sm hover:bg-muted no-underline inline-block"
                        >
                          Message
                        </a>
                        @if (isPeriodExceeded(mentee)) {
                          <a
                            [routerLink]="['/dashboard/mentor/report', mentee.mentorshipId]"
                            class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs hover:opacity-90 no-underline inline-block"
                          >
                            End mentorship & add report
                          </a>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
        <div class="p-4">
          <mc-pagination
            [totalItems]="activeTotalCount"
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
  private readonly store = inject(Store<AppState>);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authApi = inject(AuthApiService);
  private readonly destroy$ = new Subject<void>();
  private readonly activeSearch$ = new Subject<string>();

  readonly ROUTES = ROUTES;
  readonly defaultCapacity = DEFAULT_MENTEE_CAPACITY;
  readonly pendingItems$ = this.store.select(selectAllUnifiedPending);
  readonly mentorCapacity$ = this.store.select(selectAuthUser).pipe(
    map((u) => parseMenteeCapacity(u?.menteeCapacity)),
  );

  unreadCounts: { byId: Record<number, number>; byName: Record<string, number> } = { byId: {}, byName: {} };
  activeSearchQuery = '';
  readonly activePageSize = PAGE_SIZE;
  activePage = 1;
  activeMentees: MenteeRow[] = [];
  activeTotalCount = 0;
  activeLoading = false;

  private mentorId: string | null = null;

  ngOnInit(): void {
    this.activeSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.activePage = 1;
      this.fetchActiveMentees();
    });

    this.store.select(selectMenteeUnreadCounts).pipe(takeUntil(this.destroy$)).subscribe((u) => {
      this.unreadCounts = u;
      this.cdr.markForCheck();
    });

    this.store.select(selectAuthUserId).pipe(takeUntil(this.destroy$)).subscribe((id) => {
      if (id && id !== this.mentorId) {
        this.mentorId = id;
        this.fetchActiveMentees();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getUnreadCount(mentee: MenteeRow): number {
    return this.unreadCounts.byName[mentee.name] ?? 0;
  }

  onActiveSearchChange(value: string): void {
    this.activeSearchQuery = value;
    this.activeSearch$.next(value);
  }

  onActivePageChange(page: number): void {
    this.activePage = page;
    this.fetchActiveMentees();
  }

  private fetchActiveMentees(): void {
    if (!this.mentorId) return;
    this.activeLoading = true;
    this.cdr.markForCheck();

    this.authApi.searchMentorMentees(this.mentorId, {
      query: this.activeSearchQuery || undefined,
      status: 'active',
      page: this.activePage,
      pageSize: this.activePageSize,
    }).pipe(takeUntil(this.destroy$)).subscribe(({ data, count }) => {
      this.activeMentees = data.map((row): MenteeRow => {
        const profile = row.mentee_profile as Record<string, unknown> | null;
        return {
          id: String(row.id),
          mentorshipId: String(row.id),
          menteeUuid: row.mentee_id,
          name: (profile?.['name'] as string) ?? 'Mentee',
          email: (profile?.['email'] as string) ?? '',
          avatar: (profile?.['avatar'] as string) ?? '',
          plan: (row as Record<string, unknown>)['plan_name'] as string ?? row.goal ?? 'Standard',
          startDate: row.started_at ? new Date(row.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
          status: row.status,
        };
      });
      this.activeTotalCount = count;
      this.activeLoading = false;
      this.cdr.markForCheck();
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  isPeriodExceeded(mentee: MenteeRow): boolean {
    const start = new Date(mentee.startDate);
    if (Number.isNaN(start.getTime())) return false;
    const months = mentee.plan.toLowerCase().includes('quarter') ? 3 : 1;
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return new Date() >= end;
  }

  onAcceptItem(item: UnifiedPendingItem): void {
    if (item.source === 'request' && item.mentorshipId) {
      this.authApi.acceptMentorship(item.mentorshipId).subscribe({
        next: () => {
          this.store.dispatch(acceptMentorshipRequest({
            request: { id: item.id, name: item.name, goal: item.goalOrPlan, message: item.detail, rating: item.rating },
          }));
          this.createConversationForMentee(item);
          this.toast.success(`${item.name} has been added to your mentees.`);
          this.fetchActiveMentees(); // Refresh BE list
        },
        error: () => { this.toast.error('Failed to accept request. Please try again.'); },
      });
    } else if (item.source === 'request') {
      this.store.dispatch(acceptMentorshipRequest({
        request: { id: item.id, name: item.name, goal: item.goalOrPlan, message: item.detail, rating: item.rating },
      }));
      this.toast.success(`${item.name} has been added to your mentees.`);
    } else {
      this.store.dispatch(acceptMenteeRequest({ menteeId: item.id }));
      this.toast.success(`${item.name} has been added to your mentees.`);
    }
  }

  private createConversationForMentee(item: UnifiedPendingItem): void {
    if (!item.menteeUuid) return;
    this.store.select(selectAuthUser).pipe(take(1)).subscribe((user) => {
      if (!user) return;
      this.authApi.getOrCreateConversation(user.id, item.menteeUuid!).subscribe({
        next: (conv) => {
          this.store.dispatch(addConversation({
            conversation: {
              id: conv.id,
              mentorId: conv.mentor_id,
              mentorProfileId: conv.mentor_id,
              menteeId: conv.mentee_id,
              mentorName: user.name,
              menteeName: item.name,
              lastMessage: conv.last_message ?? '',
              lastTimestamp: '',
              status: 'active',
              messages: [],
            },
          }));
        },
      });
    });
  }

  async onDeclineItem(item: UnifiedPendingItem): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Decline request',
      message: `Are you sure you want to decline ${item.name}'s mentorship request? They will be notified.`,
      confirmLabel: 'Yes, decline',
      cancelLabel: 'Keep request',
      variant: 'danger',
    });
    if (!confirmed) return;
    if (item.source === 'request' && item.mentorshipId) {
      this.authApi.declineMentorship(item.mentorshipId).subscribe({
        next: () => {
          this.store.dispatch(declineMentorshipRequest({ requestId: item.id }));
          this.toast.success(`Request from ${item.name} has been declined.`);
        },
        error: () => { this.toast.error('Failed to decline request. Please try again.'); },
      });
    } else if (item.source === 'request') {
      this.store.dispatch(declineMentorshipRequest({ requestId: item.id }));
      this.toast.success(`Request from ${item.name} has been declined.`);
    } else {
      this.store.dispatch(removeMenteeFromList({ menteeId: item.id }));
      this.toast.success(`Request from ${item.name} has been declined.`);
    }
  }
}
