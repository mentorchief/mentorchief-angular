import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import type { AppState } from '../../store/app.state';
import { selectAuthUser } from '../auth/store/auth.selectors';
import {
  selectMentorStatsComputed,
  selectAllUnifiedPending,
  type UnifiedPendingItem,
} from './store/dashboard.selectors';
import { take } from 'rxjs';
import { acceptMenteeRequest, acceptMentorshipRequest, declineMentorshipRequest, removeMenteeFromList } from './store/dashboard.actions';
import { addConversation } from '../../store/messaging/messaging.actions';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthApiService } from '../../core/services/auth-api.service';

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
        @for (stat of (mentorStats$ | async) ?? []; track stat.label) {
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
          @if ((pendingWithReports$ | async)?.length) {
          <div class="bg-card rounded-lg border border-border p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <h3 class="text-foreground font-medium">Pending Requests</h3>
                <span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">{{ (pendingWithReports$ | async)?.length ?? 0 }} new</span>
              </div>
            </div>
            <div class="space-y-3">
              @for (item of (pendingWithReports$ | async) ?? []; track item.id + item.source) {
                <div class="bg-card rounded-lg border border-amber-200 p-5">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center shrink-0">
                      <span class="text-primary-foreground font-medium">{{ getInitials(item.name) }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-foreground font-medium">{{ item.name }}</h3>
                      <p class="text-muted-foreground text-sm truncate">{{ item.detail }}</p>
                      <p class="text-muted-foreground text-xs mt-1">{{ item.source === 'request' ? 'Goal' : 'Plan' }}: {{ item.goalOrPlan }}</p>
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
                    <div class="flex gap-2 shrink-0">
                      <button
                        type="button"
                        (click)="onAccept(item)"
                        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        (click)="onDecline(item)"
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
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- How it works hint -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="flex items-start gap-3">
              <fa-icon [icon]="['fas', 'circle-info']" class="text-indigo-500 w-4 h-4 mt-0.5" />
              <div>
                <p class="text-gray-900 text-sm font-medium mb-2">How the mentorship cycle works</p>
                <ol class="text-gray-500 text-xs space-y-1.5 list-decimal list-inside">
                  <li>A mentee sends you a mentorship request</li>
                  <li>Review and accept or decline the request</li>
                  <li>Once accepted, their payment is held in escrow</li>
                  <li>Guide your mentee throughout the subscription period</li>
                  <li>When the period ends, submit a report and funds are released to you</li>
                </ol>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-gray-900 font-medium mb-4">Quick Actions</h3>
            <div class="space-y-2">
              <a
                routerLink="/dashboard/mentor/mentees"
                class="w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 transition-colors no-underline"
              >
                <div class="w-9 h-9 rounded-md flex items-center justify-center bg-indigo-50 text-indigo-600"><fa-icon [icon]="['fas', 'users']" class="w-4 h-4" /></div>
                <span class="text-gray-900 text-sm">My Mentees</span>
                <span class="ml-auto text-gray-400">→</span>
              </a>
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
  private readonly store = inject(Store<AppState>);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly authApi = inject(AuthApiService);

  readonly user$ = this.store.select(selectAuthUser);
  readonly mentorStats$ = this.store.select(selectMentorStatsComputed);
  readonly pendingWithReports$ = this.store.select(selectAllUnifiedPending);

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  onAccept(item: UnifiedPendingItem): void {
    if (item.source === 'request' && item.mentorshipId) {
      this.authApi.acceptMentorship(item.mentorshipId).subscribe({
        next: () => {
          this.store.dispatch(acceptMentorshipRequest({
            request: { id: item.id, name: item.name, goal: item.goalOrPlan, message: item.detail, rating: item.rating },
          }));
          this.createConversationForMentee(item);
          // Notify mentee that mentor accepted
          if (item.menteeUuid) {
            this.authApi.createNotification({
              userId: item.menteeUuid,
              type: 'mentorship_request',
              title: 'Mentorship request accepted!',
              body: `Your mentor has accepted your request. Please contact the admin via WhatsApp to arrange payment.`,
              metadata: { mentorshipId: item.mentorshipId },
            }).subscribe();
          }
          this.toast.success(`${item.name} has been added to your mentees.`);
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

  async onDecline(item: UnifiedPendingItem): Promise<void> {
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
          // Notify mentee that mentor declined
          if (item.menteeUuid) {
            this.authApi.createNotification({
              userId: item.menteeUuid,
              type: 'mentorship_request',
              title: 'Mentorship request declined',
              body: `Unfortunately, the mentor has declined your request. You can browse other mentors and try again.`,
              metadata: { mentorshipId: item.mentorshipId },
            }).subscribe();
          }
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
