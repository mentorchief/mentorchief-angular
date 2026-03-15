import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import type { AppState } from '../../store/app.state';
import { selectAuthUser, selectIsAuthenticated } from '../../features/auth/store/auth.selectors';
import { logout } from '../../features/auth/store/auth.actions';
import type { User } from '../../core/models/user.model';

@Component({
  selector: 'mc-navbar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2.5 no-underline">
            <div class="w-9 h-9 bg-primary rounded-md flex items-center justify-center">
              <span class="text-white font-bold text-sm">M</span>
            </div>
            <span class="text-foreground tracking-tight font-serif text-xl">
              Mentor<span class="text-primary">chief</span>
            </span>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-8">
            <a routerLink="/browse" class="text-muted-foreground hover:text-foreground transition-colors no-underline">
              Find Mentors
            </a>
            <a routerLink="/how-it-works" class="text-muted-foreground hover:text-foreground transition-colors no-underline">
              How It Works
            </a>
          </div>

          <!-- CTA / User Menu -->
          <div class="hidden md:flex items-center gap-3">
            @if (isAuthenticated$ | async) {
              @if (user$ | async; as user) {
                <div class="relative">
                  <button
                    (click)="dropdownOpen = !dropdownOpen"
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
              }
            } @else {
              <a routerLink="/login" class="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors no-underline">
                Log in
              </a>
              <a routerLink="/signup" class="px-5 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity no-underline">
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
            <a routerLink="/browse" class="px-3 py-2 text-muted-foreground hover:text-foreground no-underline" (click)="mobileOpen = false">
              Find Mentors
            </a>
            <a routerLink="/how-it-works" class="px-3 py-2 text-muted-foreground hover:text-foreground no-underline" (click)="mobileOpen = false">
              How It Works
            </a>
            <hr class="border-border" />
            @if (isAuthenticated$ | async) {
              @if (user$ | async; as user) {
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
              }
            } @else {
              <a routerLink="/login" class="px-3 py-2 text-muted-foreground no-underline" (click)="mobileOpen = false">
                Log in
              </a>
              <a routerLink="/signup" class="mx-3 px-5 py-2 bg-primary text-primary-foreground rounded-md text-center no-underline" (click)="mobileOpen = false">
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

  readonly isAuthenticated$: Observable<boolean> = this.store.select(selectIsAuthenticated);
  readonly user$: Observable<User | null> = this.store.select(selectAuthUser);

  dropdownOpen = false;
  mobileOpen = false;

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getDashboardPath(user: User): string {
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'mentor') return '/dashboard/mentor';
    return '/dashboard/mentee';
  }

  getProfilePath(user: User): string {
    return `${this.getDashboardPath(user)}/settings`;
  }

  onLogout(): void {
    this.dropdownOpen = false;
    this.mobileOpen = false;
    this.store.dispatch(logout());
  }
}
