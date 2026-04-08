import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subject, combineLatest, takeUntil, switchMap, of } from 'rxjs';
import { map } from 'rxjs';
import { AuthFacade } from '../../core/facades/auth.facade';
import { NotificationsFacade } from '../../core/facades/notifications.facade';
import { SubscriptionsFacade } from '../../core/facades/subscriptions.facade';
import { UserRole, type User } from '../../core/models/user.model';
import type { AppNotification } from '../../core/models/dashboard.model';
import { ROUTES } from '../../core/routes';

@Component({
  selector: 'mc-navbar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a [routerLink]="ROUTES.home" class="flex items-center gap-2.5 no-underline">
            <div class="w-9 h-9 bg-primary rounded-md flex items-center justify-center">
              <span class="text-white font-bold text-sm">M</span>
            </div>
            <span class="text-foreground tracking-tight font-serif text-xl">
              Mentor<span class="text-primary">chief</span>
            </span>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-8">
            <a [routerLink]="ROUTES.browse" class="text-muted-foreground hover:text-foreground transition-colors no-underline">
              Find Mentors
            </a>
            <a [routerLink]="ROUTES.howItWorks" class="text-muted-foreground hover:text-foreground transition-colors no-underline">
              How It Works
            </a>
          </div>

          <!-- CTA / User Menu -->
          <div class="hidden md:flex items-center gap-3">
            @if (auth.currentUser$ | async; as user) {
              <!-- Notification Bell -->
              <div class="relative">
                <button
                  (click)="notifOpen = !notifOpen; dropdownOpen = false"
                  class="relative p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <fa-icon [icon]="['fas', 'bell']" class="text-muted-foreground w-5 h-5" />
                  @if (unreadCount > 0) {
                    <span class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-destructive text-white text-[10px] font-bold rounded-full">
                      {{ unreadCount > 99 ? '99+' : unreadCount }}
                    </span>
                  }
                </button>
                @if (notifOpen) {
                  <div class="absolute right-0 top-full mt-1.5 w-96 bg-white rounded-lg border border-border shadow-xl z-50 max-h-[28rem] flex flex-col">
                    <div class="px-4 py-3 border-b border-border flex items-center justify-between">
                      <h3 class="text-sm font-medium text-foreground">Notifications</h3>
                      @if (unreadCount > 0) {
                        <button (click)="onMarkAllRead(user.id)" class="text-xs text-primary hover:underline">Mark all read</button>
                      }
                    </div>
                    <div class="flex-1 overflow-y-auto">
                      @if (notifications.length === 0) {
                        <p class="text-sm text-muted-foreground p-4 text-center">No notifications yet.</p>
                      }
                      @for (notif of notifications; track notif.id) {
                        <div
                          class="px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer"
                          [class.bg-indigo-50]="!notif.read"
                          (click)="onNotifClick(notif)"
                        >
                          <div class="flex items-start gap-2">
                            <div class="shrink-0 mt-0.5">
                              @if (notif.type === 'mentorship_approved') {
                                <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><fa-icon [icon]="['fas', 'check']" class="text-green-600 w-3.5 h-3.5" /></div>
                              } @else if (notif.type === 'subscription_activated') {
                                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><fa-icon [icon]="['fas', 'rocket']" class="text-primary w-3.5 h-3.5" /></div>
                              } @else if (notif.type === 'payment_rejected') {
                                <div class="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center"><fa-icon [icon]="['fas', 'xmark']" class="text-destructive w-3.5 h-3.5" /></div>
                              } @else {
                                <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><fa-icon [icon]="['fas', 'bell']" class="text-muted-foreground w-3.5 h-3.5" /></div>
                              }
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-sm text-foreground font-medium">{{ notif.title }}</p>
                              <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">{{ notif.message }}</p>
                              @if (notif.whatsappLink && !isLinkUsed(notif)) {
                                <a
                                  [href]="notif.whatsappLink"
                                  target="_blank"
                                  rel="noopener"
                                  class="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs hover:bg-green-700 no-underline"
                                  (click)="$event.stopPropagation()"
                                >
                                  <fa-icon [icon]="['fab', 'whatsapp']" class="w-3.5 h-3.5" /> Pay via WhatsApp
                                </a>
                              }
                              @if (notif.whatsappLink && isLinkUsed(notif)) {
                                <span class="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-muted text-muted-foreground rounded-md text-xs">
                                  <fa-icon [icon]="['fas', 'check']" class="w-3 h-3" /> Payment submitted
                                </span>
                              }
                            </div>
                            @if (!notif.read) {
                              <div class="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"></div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                    <div class="px-4 py-2.5 border-t border-border">
                      <button
                        (click)="goToNotifications(user); notifOpen = false"
                        class="w-full text-center text-sm text-primary hover:underline"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                }
              </div>

              <div class="relative">
                <button
                  (click)="dropdownOpen = !dropdownOpen; notifOpen = false"
                  class="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <div class="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <span class="text-white text-xs font-medium">{{ getInitials(user.name) }}</span>
                  </div>
                  <div class="text-left">
                    <p class="text-sm text-foreground leading-tight">{{ user.name }}</p>
                    <p class="text-xs text-muted-foreground capitalize leading-tight">{{ user.role }}</p>
                  </div>
                  <fa-icon [icon]="['fas', 'chevron-down']" class="text-muted-foreground text-xs transition-transform w-3 h-3" [class.rotate-180]="dropdownOpen" />
                </button>

                @if (dropdownOpen) {
                  <div class="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-lg border border-border shadow-lg py-1.5 z-50">
                    <div class="px-3 py-2 border-b border-border mb-1">
                      <p class="text-sm text-foreground">{{ user.name }}</p>
                      <p class="text-xs text-muted-foreground">{{ user.email }}</p>
                    </div>
                    <a
                      [routerLink]="getDashboardPath(user)"
                      (click)="dropdownOpen = false"
                      class="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors no-underline"
                    >
                      <fa-icon [icon]="['fas', 'chart-simple']" class="text-muted-foreground w-4 h-4" />
                      Dashboard
                    </a>
                    <a
                      [routerLink]="getProfilePath(user)"
                      (click)="dropdownOpen = false"
                      class="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors no-underline"
                    >
                      <fa-icon [icon]="['fas', 'user']" class="text-muted-foreground w-4 h-4" />
                      Profile
                    </a>
                    <div class="border-t border-border mt-1 pt-1">
                      <button
                        (click)="onLogout()"
                        class="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <fa-icon [icon]="['fas', 'right-from-bracket']" class="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <a [routerLink]="ROUTES.login" class="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors no-underline">
                Log in
              </a>
              <a [routerLink]="ROUTES.signup" class="px-5 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity no-underline">
                Get Started
              </a>
            }
          </div>

          <!-- Mobile Hamburger -->
          <button
            class="md:hidden p-2 text-foreground"
            (click)="mobileOpen = !mobileOpen"
          >
            <fa-icon [icon]="mobileOpen ? ['fas', 'xmark'] : ['fas', 'bars']" class="w-5 h-5" />
          </button>
        </div>

        <!-- Mobile Menu -->
        @if (mobileOpen) {
          <div class="md:hidden pb-4 border-t border-border pt-4 flex flex-col gap-3">
            <a [routerLink]="ROUTES.browse" class="px-3 py-2 text-muted-foreground hover:text-foreground no-underline" (click)="mobileOpen = false">
              Find Mentors
            </a>
            <a [routerLink]="ROUTES.howItWorks" class="px-3 py-2 text-muted-foreground hover:text-foreground no-underline" (click)="mobileOpen = false">
              How It Works
            </a>
            <hr class="border-border" />
            @if (auth.currentUser$ | async; as user) {
              <div class="px-3 py-2 flex items-center gap-2.5">
                <div class="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <span class="text-white text-xs font-medium">{{ getInitials(user.name) }}</span>
                </div>
                <div>
                  <p class="text-sm text-foreground">{{ user.name }}</p>
                  <p class="text-xs text-muted-foreground capitalize">{{ user.role }}</p>
                </div>
              </div>
              <a [routerLink]="getDashboardPath(user)" class="px-3 py-2 text-muted-foreground no-underline flex items-center gap-2" (click)="mobileOpen = false">
                <fa-icon [icon]="['fas', 'chart-simple']" class="w-4 h-4" /> Dashboard
              </a>
              <a [routerLink]="getProfilePath(user)" class="px-3 py-2 text-muted-foreground no-underline flex items-center gap-2" (click)="mobileOpen = false">
                <fa-icon [icon]="['fas', 'user']" class="w-4 h-4" /> Profile
              </a>
              <button type="button" (click)="onLogout()" class="px-3 py-2 text-destructive flex items-center gap-2 text-left">
                <fa-icon [icon]="['fas', 'right-from-bracket']" class="w-4 h-4" /> Sign Out
              </button>
            } @else {
              <a [routerLink]="ROUTES.login" class="px-3 py-2 text-muted-foreground no-underline" (click)="mobileOpen = false">
                Log in
              </a>
              <a [routerLink]="ROUTES.signup" class="mx-3 px-5 py-2 bg-primary text-primary-foreground rounded-md text-center no-underline" (click)="mobileOpen = false">
                Get Started
              </a>
            }
          </div>
        }
      </div>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthFacade);
  private readonly notifFacade = inject(NotificationsFacade);
  private readonly subsFacade = inject(SubscriptionsFacade);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly ROUTES = ROUTES;
  dropdownOpen = false;
  mobileOpen = false;
  notifOpen = false;

  notifications: AppNotification[] = [];
  unreadCount = 0;
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
        if (!user) return of({ notifications: [] as AppNotification[], usedIds: new Set<string>() });
        const allowedTypes =
          user.role === UserRole.Mentee ? NavbarComponent.MENTEE_NOTIF_TYPES :
          user.role === UserRole.Mentor ? NavbarComponent.MENTOR_NOTIF_TYPES :
          NavbarComponent.ADMIN_NOTIF_TYPES;
        return combineLatest([
          this.notifFacade.forUser$(user.id),
          this.subsFacade.all$,
        ]).pipe(
          map(([notifs, subs]) => {
            const filtered = notifs.filter((n) => allowedTypes.has(n.type));
            const usedIds = new Set(subs.filter((s) => s.linkUsed).map((s) => s.id));
            return { notifications: filtered, usedIds };
          }),
        );
      }),
    ).subscribe(({ notifications, usedIds }) => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter((n) => !n.read).length;
      this.usedSubIds = usedIds;
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

  onNotifClick(notif: AppNotification): void {
    if (!notif.read) this.notifFacade.markRead(notif.id);
  }

  onMarkAllRead(userId: string): void {
    this.notifFacade.markAllRead(userId);
  }

  goToNotifications(user: User): void {
    if (user.role === UserRole.Admin) void this.router.navigate([ROUTES.admin.notifications]);
    else if (user.role === UserRole.Mentor) void this.router.navigate([ROUTES.mentor.notifications]);
    else void this.router.navigate([ROUTES.mentee.notifications]);
  }

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getDashboardPath(user: User): string {
    if (user.role === UserRole.Admin) return ROUTES.admin.dashboard;
    if (user.role === UserRole.Mentor) return ROUTES.mentor.dashboard;
    return ROUTES.mentee.dashboard;
  }

  getProfilePath(user: User): string {
    if (user.role === UserRole.Admin) return ROUTES.admin.settings;
    if (user.role === UserRole.Mentor) return ROUTES.mentor.settings;
    return ROUTES.mentee.settings;
  }

  onLogout(): void {
    this.dropdownOpen = false;
    this.mobileOpen = false;
    this.notifOpen = false;
    this.auth.logout();
  }
}
