import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';
import type { AppState } from '../../store/app.state';
import { selectAuthUser, selectIsAuthenticated, selectAuthUserId } from '../../features/auth/store/auth.selectors';
import { logout } from '../../features/auth/store/auth.actions';
import { MentorApprovalStatus, UserRole, type User } from '../../core/models/user.model';
import { ROUTES } from '../../core/routes';
import { selectAllNotifications, selectUnreadCount } from '../../store/notifications/notifications.selectors';
import { markNotificationRead, markAllNotificationsRead } from '../../store/notifications/notifications.actions';
import { AuthApiService } from '../../core/services/auth-api.service';
import type { AppNotification } from '../../store/notifications/notifications.state';

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
            @if (isAuthenticated$ | async) {
              <!-- Notification Bell -->
              @if (user$ | async; as user) {
                <div class="relative">
                  <button
                    (click)="toggleNotifications($event)"
                    class="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                    title="Notifications"
                  >
                    <fa-icon [icon]="['fas', 'bell']" class="w-5 h-5" />
                    @if ($any(unreadCount$ | async) > 0) {
                      <span class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium rounded-full">
                        {{ $any(unreadCount$ | async) > 99 ? '99+' : $any(unreadCount$ | async) }}
                      </span>
                    }
                  </button>

                  @if (notifOpen) {
                    <div class="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-lg border border-border shadow-lg z-50 overflow-hidden">
                      <!-- Header -->
                      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
                        <span class="text-sm font-medium text-foreground">Notifications</span>
                        @if ($any(unreadCount$ | async) > 0) {
                          <button (click)="markAllRead()" class="text-xs text-primary hover:underline">Mark all as read</button>
                        }
                      </div>

                      <!-- List -->
                      <div class="max-h-80 overflow-y-auto">
                        @if ((notifications$ | async)?.length === 0) {
                          <div class="px-4 py-8 text-center">
                            <fa-icon [icon]="['fas', 'bell']" class="text-2xl text-muted-foreground/40 mb-2" />
                            <p class="text-sm text-muted-foreground">No notifications yet</p>
                          </div>
                        } @else {
                          @for (n of (notifications$ | async)?.slice(0, 6); track n.id) {
                            <div
                              (click)="onClickNotif(n)"
                              [class]="'flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/30 transition-colors' + (!n.read ? ' bg-primary/5' : '')"
                            >
                              <div [class]="getIconBg(n.type)" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                <fa-icon [icon]="getIcon(n.type)" class="text-xs" [class]="getIconColor(n.type)" />
                              </div>
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between gap-1">
                                  <p class="text-xs font-medium text-foreground truncate">{{ n.title }}</p>
                                  @if (!n.read) {
                                    <span class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                                  }
                                </div>
                                <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">{{ n.body }}</p>
                                <p class="text-[10px] text-muted-foreground mt-1">{{ formatDate(n.createdAt) }}</p>
                              </div>
                            </div>
                          }
                        }
                      </div>

                      <!-- Footer -->
                      <div class="px-4 py-2.5 border-t border-border">
                        <a
                          [routerLink]="getNotificationsPath(user)"
                          (click)="notifOpen = false"
                          class="block text-center text-xs text-primary hover:underline no-underline"
                        >
                          See all notifications
                        </a>
                      </div>
                    </div>
                  }
                </div>
              }
              @if (user$ | async; as user) {
                <div class="relative">
                  <button
                    (click)="dropdownOpen = !dropdownOpen"
                    class="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    @if (isAvatarUrl(user.avatar)) {
                      <img [src]="user.avatar" [alt]="user.name" class="w-8 h-8 rounded-md object-cover" />
                    } @else {
                      <div class="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                        <span class="text-white text-xs font-medium">{{ getInitials(user.name) }}</span>
                      </div>
                    }
                    <div class="text-left">
                      <p class="text-sm text-foreground leading-tight">{{ user.name }}</p>
                      <p class="text-xs text-muted-foreground capitalize leading-tight">{{ user.role }}</p>
                    </div>
                    <fa-icon [icon]="['fas', 'chevron-down']" class="text-muted-foreground text-xs transition-transform w-3 h-3" [class.rotate-180]="dropdownOpen" />
                  </button>

                  @if (dropdownOpen) {
                    <div class="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-lg border border-border shadow-lg py-1.5 z-50">
                      <div class="px-3 py-2 border-b border-border mb-1">
                        <p class="text-sm text-foreground truncate">{{ user.name }}</p>
                        <p class="text-xs text-muted-foreground truncate">{{ user.email }}</p>
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
              }
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
            @if (isAuthenticated$ | async) {
              @if (user$ | async; as user) {
                <div class="px-3 py-2 flex items-center gap-2.5">
                  @if (isAvatarUrl(user.avatar)) {
                    <img [src]="user.avatar" [alt]="user.name" class="w-8 h-8 rounded-md object-cover" />
                  } @else {
                    <div class="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                      <span class="text-white text-xs font-medium">{{ getInitials(user.name) }}</span>
                    </div>
                  }
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
              }
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
export class NavbarComponent {
  private readonly store = inject(Store<AppState>);
  private readonly authApi = inject(AuthApiService);

  readonly isAuthenticated$: Observable<boolean> = this.store.select(selectIsAuthenticated);
  readonly user$: Observable<User | null> = this.store.select(selectAuthUser);
  readonly unreadCount$: Observable<number> = this.store.select(selectUnreadCount);
  readonly notifications$: Observable<AppNotification[]> = this.store.select(selectAllNotifications);

  readonly ROUTES = ROUTES;
  dropdownOpen = false;
  mobileOpen = false;
  notifOpen = false;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.notifOpen = false;
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.notifOpen = !this.notifOpen;
    this.dropdownOpen = false;
  }

  onClickNotif(n: AppNotification): void {
    if (!n.read) {
      this.store.dispatch(markNotificationRead({ id: n.id }));
      this.authApi.markNotificationRead(n.id).subscribe();
    }
    this.notifOpen = false;
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
      const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return iso; }
  }

  isAvatarUrl(avatar: string | undefined): boolean {
    return !!avatar && (avatar.startsWith('http') || avatar.startsWith('/'));
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getNotificationsPath(user: User): string {
    if (user.role === UserRole.Admin) return ROUTES.admin.dashboard + '/notifications';
    if (user.role === UserRole.Mentor) {
      const status = user.mentorApprovalStatus;
      if (status === MentorApprovalStatus.Pending) return ROUTES.mentor.pending;
      if (status === MentorApprovalStatus.Rejected) return ROUTES.mentor.rejected;
      return '/dashboard/mentor/notifications';
    }
    return '/dashboard/mentee/notifications';
  }

  getDashboardPath(user: User): string {
    if (user.role === UserRole.Admin) return ROUTES.admin.dashboard;
    if (user.role === UserRole.Mentor) {
      const status = user.mentorApprovalStatus;
      if (status === MentorApprovalStatus.Pending) return ROUTES.mentor.pending;
      if (status === MentorApprovalStatus.Rejected) return ROUTES.mentor.rejected;
      return ROUTES.mentor.dashboard;
    }
    return ROUTES.mentee.dashboard;
  }

  getProfilePath(user: User): string {
    if (user.role === UserRole.Admin) return ROUTES.admin.settings;
    if (user.role === UserRole.Mentor) {
      const status = user.mentorApprovalStatus;
      if (status === MentorApprovalStatus.Pending) return ROUTES.mentor.pending;
      if (status === MentorApprovalStatus.Rejected) return ROUTES.mentor.rejected;
      return ROUTES.mentor.settings;
    }
    return ROUTES.mentee.settings;
  }

  onLogout(): void {
    this.dropdownOpen = false;
    this.mobileOpen = false;
    this.store.dispatch(logout());
  }
}
