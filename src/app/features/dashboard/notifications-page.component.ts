import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subject, combineLatest, takeUntil, switchMap, of } from 'rxjs';
import { map } from 'rxjs';
import { AuthFacade } from '../../core/facades/auth.facade';
import { NotificationsFacade } from '../../core/facades/notifications.facade';
import { SubscriptionsFacade } from '../../core/facades/subscriptions.facade';
import type { AppNotification } from '../../core/models/dashboard.model';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'mc-notifications-page',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="p-6 lg:p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl lg:text-3xl text-foreground">Notifications</h1>
          <p class="text-muted-foreground mt-1">Stay updated on your mentorship activity</p>
        </div>
        @if (unreadCount > 0) {
          <button
            type="button"
            (click)="onMarkAllRead()"
            class="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-muted"
          >
            Mark all as read
          </button>
        }
      </div>

      @if (notifications.length === 0) {
        <div class="bg-card rounded-lg border border-border p-12 text-center">
          <div class="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
            <fa-icon [icon]="['fas', 'bell-slash']" class="text-muted-foreground w-7 h-7" />
          </div>
          <h2 class="text-foreground text-lg font-medium mb-2">No notifications yet</h2>
          <p class="text-muted-foreground text-sm">When you receive notifications about your mentorship activity, they'll appear here.</p>
        </div>
      } @else {
        <div class="space-y-2">
          @for (notif of notifications; track notif.id) {
            <div
              class="bg-card rounded-lg border border-border p-5 hover:shadow-sm transition-shadow cursor-pointer"
              [class.border-l-4]="!notif.read"
              [class.border-l-primary]="!notif.read"
              (click)="onMarkRead(notif)"
            >
              <div class="flex items-start gap-4">
                <!-- Icon -->
                <div class="shrink-0">
                  @if (notif.type === 'mentorship_approved') {
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <fa-icon [icon]="['fas', 'check-circle']" class="text-green-600 w-5 h-5" />
                    </div>
                  } @else if (notif.type === 'subscription_activated') {
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <fa-icon [icon]="['fas', 'rocket']" class="text-blue-600 w-5 h-5" />
                    </div>
                  } @else if (notif.type === 'payment_confirmed') {
                    <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <fa-icon [icon]="['fas', 'credit-card']" class="text-emerald-600 w-5 h-5" />
                    </div>
                  } @else if (notif.type === 'mentorship_declined') {
                    <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <fa-icon [icon]="['fas', 'user-xmark']" class="text-amber-600 w-5 h-5" />
                    </div>
                  } @else if (notif.type === 'payment_rejected') {
                    <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <fa-icon [icon]="['fas', 'circle-xmark']" class="text-red-600 w-5 h-5" />
                    </div>
                  } @else {
                    <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <fa-icon [icon]="['fas', 'bell']" class="text-muted-foreground w-5 h-5" />
                    </div>
                  }
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <h3 class="text-foreground font-medium text-sm">{{ notif.title }}</h3>
                      <p class="text-muted-foreground text-sm mt-1">{{ notif.message }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      @if (!notif.read) {
                        <span class="w-2.5 h-2.5 rounded-full bg-primary"></span>
                      }
                    </div>
                  </div>

                  <!-- Details -->
                  <div class="mt-3 flex flex-wrap items-center gap-3">
                    @if (notif.subscriptionId) {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md text-xs text-muted-foreground">
                        <fa-icon [icon]="['fas', 'hashtag']" class="w-3 h-3" />
                        {{ notif.subscriptionId }}
                      </span>
                    }
                    <span class="text-xs text-muted-foreground">
                      {{ formatDate(notif.createdAt) }}
                    </span>
                  </div>

                  <!-- Actions -->
                  @if (notif.whatsappLink) {
                    <div class="mt-3">
                      @if (!isLinkUsed(notif)) {
                        <a
                          [href]="notif.whatsappLink"
                          target="_blank"
                          rel="noopener"
                          class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 no-underline"
                          (click)="$event.stopPropagation()"
                        >
                          <fa-icon [icon]="['fab', 'whatsapp']" class="w-4 h-4" />
                          Open WhatsApp to Pay
                        </a>
                      } @else {
                        <span class="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm">
                          <fa-icon [icon]="['fas', 'check-circle']" class="w-4 h-4 text-green-600" />
                          Payment submitted — link no longer valid
                        </span>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthFacade);
  private readonly notifFacade = inject(NotificationsFacade);
  private readonly subsFacade = inject(SubscriptionsFacade);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  notifications: AppNotification[] = [];
  unreadCount = 0;
  private userId = '';
  private usedSubIds = new Set<string>();

  private static readonly MENTEE_NOTIF_TYPES: Set<string> = new Set([
    'mentorship_approved', 'mentorship_declined', 'subscription_activated', 'payment_rejected',
  ]);
  private static readonly MENTOR_NOTIF_TYPES: Set<string> = new Set([
    'subscription_activated', 'new_mentee_request',
  ]);
  private static readonly ADMIN_NOTIF_TYPES: Set<string> = new Set([
    'payment_confirmed', 'subscription_activated',
  ]);

  ngOnInit(): void {
    this.auth.currentUser$.pipe(
      takeUntil(this.destroy$),
      switchMap((user) => {
        if (!user) return of({ notifications: [] as AppNotification[], usedIds: new Set<string>(), userId: '' });
        const allowedTypes =
          user.role === UserRole.Mentee ? NotificationsPageComponent.MENTEE_NOTIF_TYPES :
          user.role === UserRole.Mentor ? NotificationsPageComponent.MENTOR_NOTIF_TYPES :
          NotificationsPageComponent.ADMIN_NOTIF_TYPES;
        return combineLatest([
          this.notifFacade.forUser$(user.id),
          this.subsFacade.all$,
        ]).pipe(
          map(([notifs, subs]) => ({
            notifications: notifs.filter((n) => allowedTypes.has(n.type)),
            usedIds: new Set(subs.filter((s) => s.linkUsed).map((s) => s.id)),
            userId: user.id,
          })),
        );
      }),
    ).subscribe(({ notifications, usedIds, userId }) => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter((n) => !n.read).length;
      this.usedSubIds = usedIds;
      this.userId = userId;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isLinkUsed(notif: AppNotification): boolean {
    return notif.subscriptionId ? this.usedSubIds.has(notif.subscriptionId) : false;
  }

  onMarkRead(notif: AppNotification): void {
    if (!notif.read) this.notifFacade.markRead(notif.id);
  }

  onMarkAllRead(): void {
    if (this.userId) this.notifFacade.markAllRead(this.userId);
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
