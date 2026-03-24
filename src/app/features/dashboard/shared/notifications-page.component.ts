import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { selectAllNotifications } from '../../../store/notifications/notifications.selectors';
import { markNotificationRead, markAllNotificationsRead } from '../../../store/notifications/notifications.actions';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { selectAuthUserId } from '../../auth/store/auth.selectors';
import { take } from 'rxjs';
import type { AppNotification } from '../../../store/notifications/notifications.state';

@Component({
  selector: 'mc-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  template: `
    <div class="p-6 lg:p-8 max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl text-foreground">Notifications</h1>
          <p class="text-muted-foreground text-sm mt-1">Your recent activity and alerts</p>
        </div>
        @if (hasUnread()) {
          <button
            (click)="markAllRead()"
            class="text-sm text-primary hover:underline"
          >
            Mark all as read
          </button>
        }
      </div>

      @if (notifications().length === 0) {
        <div class="bg-card rounded-lg border border-border p-10 text-center">
          <div class="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <fa-icon [icon]="['fas', 'bell']" class="text-xl text-muted-foreground" />
          </div>
          <h3 class="text-base font-medium text-foreground">No notifications yet</h3>
          <p class="text-sm text-muted-foreground mt-1">You're all caught up!</p>
        </div>
      } @else {
        <div class="space-y-2">
          @for (n of notifications(); track n.id) {
            <div
              (click)="onClickNotification(n)"
              class="bg-card rounded-lg border border-border px-5 py-4 flex items-start gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
              [class.opacity-60]="n.read"
            >
              <div [class]="getIconBg(n.type)" class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <fa-icon [icon]="getIcon(n.type)" class="text-sm" [class]="getIconColor(n.type)" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <p class="text-sm font-medium text-foreground">{{ n.title }}</p>
                  @if (!n.read) {
                    <span class="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"></span>
                  }
                </div>
                <p class="text-sm text-muted-foreground mt-0.5">{{ n.body }}</p>
                <p class="text-xs text-muted-foreground mt-1">{{ formatDate(n.createdAt) }}</p>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent {
  private readonly store = inject(Store);
  private readonly authApi = inject(AuthApiService);

  readonly notifications = this.store.selectSignal(selectAllNotifications);

  hasUnread(): boolean {
    return this.notifications().some((n) => !n.read);
  }

  onClickNotification(n: AppNotification): void {
    if (!n.read) {
      this.store.dispatch(markNotificationRead({ id: n.id }));
      this.authApi.markNotificationRead(n.id).subscribe();
    }
  }

  markAllRead(): void {
    this.store.dispatch(markAllNotificationsRead());
    this.store.select(selectAuthUserId).pipe(take(1)).subscribe((userId) => {
      if (userId) this.authApi.markAllNotificationsRead(userId).subscribe();
    });
  }

  getIcon(type: AppNotification['type']): [string, string] {
    switch (type) {
      case 'report_required': return ['fas', 'file-pen'];
      case 'report_submitted': return ['fas', 'circle-check'];
      case 'payment_released': return ['fas', 'dollar-sign'];
      case 'new_message': return ['fas', 'message'];
      case 'mentorship_request': return ['fas', 'user-plus'];
      case 'payment_updated': return ['fas', 'credit-card'];
      case 'account_updated': return ['fas', 'shield-halved'];
    }
  }

  getIconBg(type: AppNotification['type']): string {
    switch (type) {
      case 'report_required': return 'bg-amber-100';
      case 'report_submitted': return 'bg-green-100';
      case 'payment_released': return 'bg-emerald-100';
      case 'new_message': return 'bg-blue-100';
      case 'mentorship_request': return 'bg-purple-100';
      case 'payment_updated': return 'bg-orange-100';
      case 'account_updated': return 'bg-indigo-100';
    }
  }

  getIconColor(type: AppNotification['type']): string {
    switch (type) {
      case 'report_required': return 'text-amber-600';
      case 'report_submitted': return 'text-green-600';
      case 'payment_released': return 'text-emerald-600';
      case 'new_message': return 'text-blue-600';
      case 'mentorship_request': return 'text-purple-600';
      case 'payment_updated': return 'text-orange-600';
      case 'account_updated': return 'text-indigo-600';
    }
  }

  formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  }
}
