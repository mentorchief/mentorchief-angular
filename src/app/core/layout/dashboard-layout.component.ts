import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import type { AppState } from '../../store/app.state';
import { selectAuthUser } from '../../features/auth/store/auth.selectors';
import { logout } from '../../features/auth/store/auth.actions';
import type { User } from '../models/user.model';
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
          @if (user$ | async; as user) {
            <div class="mb-6 p-3 bg-muted/50 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
                  <span class="text-primary-foreground text-sm font-medium">{{ getInitials(user.name) }}</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-foreground">{{ user.name }}</p>
                  <p class="text-xs text-muted-foreground capitalize">{{ user.role }}</p>
                </div>
              </div>
            </div>

            <nav class="space-y-1">
              @for (item of getNavItems(user); track item.path) {
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
          <div class="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
            Demo data – numbers and names are for illustration only.
          </div>
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
  readonly user$: Observable<User | null> = this.store.select(selectAuthUser);

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getNavItems(user: User): NavItem[] {
    if (user.role === 'mentee') {
      return [
        { label: 'Dashboard', path: '/dashboard/mentee', icon: ['fas', 'house'] },
        { label: 'My Mentors', path: '/dashboard/mentee/my-mentors', icon: ['fas', 'users'] },
        { label: 'Messages', path: '/dashboard/mentee/messages', icon: ['fas', 'message'] },
        { label: 'Payments', path: '/dashboard/mentee/payments', icon: ['fas', 'credit-card'] },
        { label: 'Reports', path: '/dashboard/mentee/reports', icon: ['fas', 'file-lines'] },
        { label: 'Settings', path: '/dashboard/mentee/settings', icon: ['fas', 'gear'] },
      ];
    }

    if (user.role === 'mentor') {
      const status = user.mentorApprovalStatus ?? 'approved';
      if (status === 'pending') {
        return [
          { label: 'Application status', path: '/dashboard/mentor/pending', icon: ['fas', 'clock'] },
        ];
      }
      if (status === 'rejected') {
        return [
          { label: 'Application status', path: '/dashboard/mentor/rejected', icon: ['fas', 'circle-xmark'] },
        ];
      }
      return [
        { label: 'Dashboard', path: '/dashboard/mentor', icon: ['fas', 'house'] },
        { label: 'My Mentees', path: '/dashboard/mentor/my-mentees', icon: ['fas', 'users'] },
        { label: 'Messages', path: '/dashboard/mentor/messages', icon: ['fas', 'message'] },
        { label: 'Earnings', path: '/dashboard/mentor/earnings', icon: ['fas', 'wallet'] },
        { label: 'Reports', path: '/dashboard/mentor/reports', icon: ['fas', 'file-lines'] },
        { label: 'Settings', path: '/dashboard/mentor/settings', icon: ['fas', 'gear'] },
      ];
    }

    if (user.role === 'admin') {
      return [
        { label: 'Dashboard', path: '/dashboard/admin', icon: ['fas', 'house'] },
        { label: 'Mentor Applications', path: '/dashboard/admin/mentor-applications', icon: ['fas', 'user-check'] },
        { label: 'Messages', path: '/dashboard/admin/messages', icon: ['fas', 'message'] },
        { label: 'Users', path: '/dashboard/admin/users', icon: ['fas', 'users'] },
        { label: 'Payments', path: '/dashboard/admin/payments', icon: ['fas', 'credit-card'] },
        { label: 'Mentorship Reports', path: '/dashboard/admin/mentorship-reports', icon: ['fas', 'file-lines'] },
        { label: 'Settings', path: '/dashboard/admin/settings', icon: ['fas', 'gear'] },
      ];
    }

    return [
      { label: 'Dashboard', path: '/dashboard', icon: ['fas', 'house'] },
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
