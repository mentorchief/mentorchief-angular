import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs';
import type { AppState } from '../../store/app.state';
import { selectAuthUser, selectActiveRole } from '../../features/auth/store/auth.selectors';
import { logout, switchActiveRole } from '../../features/auth/store/auth.actions';
import { MentorApprovalStatus, UserRole, type User } from '../models/user.model';
import { ROUTES } from '../routes';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';

type IconProp = [string, string];

interface NavItem {
  label: string;
  path: string;
  icon: IconProp;
}

@Component({
  selector: 'mc-dashboard-layout',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterOutlet, RouterLink, RouterLinkActive, NavbarComponent],
  template: `
    <div class="min-h-screen bg-background">
      <mc-navbar />
      <div class="flex">
        <!-- Sidebar -->
        <aside class="hidden lg:block w-64 min-h-[calc(100vh-64px)] bg-card border-r border-border p-4">
          @if (vm$ | async; as vm) {
            <div class="mb-4 p-3 bg-muted/50 rounded-lg">
              <div class="flex items-center gap-3">
                @if (isAvatarUrl(vm.user.avatar)) {
                  <img [src]="vm.user.avatar" [alt]="vm.user.name" class="w-10 h-10 rounded-md object-cover" />
                } @else {
                  <div class="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
                    <span class="text-primary-foreground text-sm font-medium">{{ getInitials(vm.user.name) }}</span>
                  </div>
                }
                <div>
                  <p class="text-sm font-medium text-foreground">{{ vm.user.name }}</p>
                  <p class="text-xs text-muted-foreground capitalize">{{ vm.user.role }}</p>
                </div>
              </div>
            </div>

            @if (vm.user.role === UserRole.Admin) {
              <div class="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
                <p class="text-xs text-muted-foreground mb-2 font-medium">View as</p>
                <div class="flex gap-1">
                  @for (r of roleOptions; track r.value) {
                    <button
                      (click)="switchRole(r.value)"
                      [class]="vm.activeRole === r.value
                        ? 'flex-1 py-1 text-xs rounded font-medium bg-primary text-primary-foreground'
                        : 'flex-1 py-1 text-xs rounded font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors'"
                    >
                      {{ r.label }}
                    </button>
                  }
                </div>
              </div>
            }

            <nav class="space-y-1">
              @for (item of getNavItems(vm.user, vm.activeRole); track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-secondary text-primary"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors no-underline"
                >
                  <fa-icon [icon]="item.icon" class="w-4 h-4" />
                  {{ item.label }}
                </a>
              }
            </nav>

            <div class="mt-6 pt-6 border-t border-border">
              <button
                (click)="onLogout()"
                class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <fa-icon [icon]="['fas', 'right-from-bracket']" class="w-4 h-4" />
                Sign Out
              </button>
            </div>
          }
        </aside>

        <!-- Main Content -->
        <main class="flex-1 min-h-[calc(100vh-64px)]">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent {
  private readonly store = inject(Store<AppState>);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly UserRole = UserRole;

  readonly roleOptions = [
    { value: UserRole.Admin, label: 'Admin' },
    { value: UserRole.Mentor, label: 'Mentor' },
    { value: UserRole.Mentee, label: 'Mentee' },
  ];

  readonly vm$: Observable<{ user: User; activeRole: UserRole | null }> = combineLatest({
    user: this.store.select(selectAuthUser),
    activeRole: this.store.select(selectActiveRole),
  }).pipe(
    filter((vm): vm is { user: User; activeRole: UserRole | null } => vm.user !== null),
  );

  switchRole(role: UserRole): void {
    this.store.dispatch(switchActiveRole({ role }));
  }

  isAvatarUrl(avatar: string | undefined): boolean {
    return !!avatar && (avatar.startsWith('http') || avatar.startsWith('/'));
  }

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getNavItems(user: User, activeRole: UserRole | null): NavItem[] {
    const role = activeRole ?? user.role;

    if (role === UserRole.Mentee) {
      return [
        { label: 'Dashboard', path: ROUTES.mentee.dashboard, icon: ['fas', 'house'] },
        { label: 'My Mentors', path: ROUTES.mentee.myMentors, icon: ['fas', 'users'] },
        { label: 'Messages', path: ROUTES.mentee.messages, icon: ['fas', 'message'] },
        { label: 'Payments', path: ROUTES.mentee.payments, icon: ['fas', 'credit-card'] },
        { label: 'Reports', path: ROUTES.mentee.reports, icon: ['fas', 'file-lines'] },
        { label: 'Settings', path: ROUTES.mentee.settings, icon: ['fas', 'gear'] },
      ];
    }

    if (role === UserRole.Mentor) {
      // Admins viewing as mentor always get full mentor nav
      if (user.role !== UserRole.Admin) {
        const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Pending;
        if (status === MentorApprovalStatus.Pending) {
          return [{ label: 'Application status', path: ROUTES.mentor.pending, icon: ['fas', 'clock'] }];
        }
        if (status === MentorApprovalStatus.Rejected) {
          return [{ label: 'Application status', path: ROUTES.mentor.rejected, icon: ['fas', 'circle-xmark'] }];
        }
      }
      return [
        { label: 'Dashboard', path: ROUTES.mentor.dashboard, icon: ['fas', 'house'] },
        { label: 'My Mentees', path: ROUTES.mentor.myMentees, icon: ['fas', 'users'] },
        { label: 'Messages', path: ROUTES.mentor.messages, icon: ['fas', 'message'] },
        { label: 'Earnings', path: ROUTES.mentor.earnings, icon: ['fas', 'wallet'] },
        { label: 'Reports', path: ROUTES.mentor.reports, icon: ['fas', 'file-lines'] },
        { label: 'My Reviews', path: ROUTES.mentor.reviews, icon: ['fas', 'star'] },
        { label: 'Settings', path: ROUTES.mentor.settings, icon: ['fas', 'gear'] },
      ];
    }

    if (role === UserRole.Admin) {
      return [
        { label: 'Dashboard', path: ROUTES.admin.dashboard, icon: ['fas', 'house'] },
        { label: 'Mentor Applications', path: ROUTES.admin.mentorApplications, icon: ['fas', 'user-check'] },
        { label: 'Messages', path: ROUTES.admin.messages, icon: ['fas', 'message'] },
        { label: 'Users', path: ROUTES.admin.users, icon: ['fas', 'users'] },
        { label: 'Payments', path: ROUTES.admin.payments, icon: ['fas', 'credit-card'] },
        { label: 'Mentorship Reports', path: ROUTES.admin.mentorshipReports, icon: ['fas', 'file-lines'] },
        { label: 'Settings', path: ROUTES.admin.settings, icon: ['fas', 'gear'] },
      ];
    }

    return [
      { label: 'Dashboard', path: ROUTES.mentee.dashboard, icon: ['fas', 'house'] },
    ];
  }

  async onLogout(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign Out',
      cancelLabel: 'Cancel',
      variant: 'default',
    });
    if (confirmed) {
      this.store.dispatch(logout());
    }
  }
}
