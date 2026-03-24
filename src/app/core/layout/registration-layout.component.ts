import { ChangeDetectionStrategy, Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';
import type { AppState } from '../../store/app.state';
import { hydrateFromSession } from '../../features/registration/store/registration.actions';
import { logout } from '../../features/auth/store/auth.actions';
import {
  selectRegistrationCurrentStep,
  selectRegistrationTotalSteps,
  selectRegistrationData,
} from '../../features/registration/store/registration.selectors';
import { selectIsAuthenticated, selectAuthUser } from '../../features/auth/store/auth.selectors';
import type { RegistrationData } from '../models/registration.model';
import type { User } from '../models/user.model';
import { ROUTES } from '../routes';

interface StepInfo {
  number: number;
  label: string;
  path: string;
}

@Component({
  selector: 'mc-registration-layout',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen bg-background flex flex-col">
      <!-- Header -->
      <header class="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <a [routerLink]="ROUTES.home" class="flex items-center gap-2.5 no-underline">
              <div class="w-9 h-9 bg-primary rounded-md flex items-center justify-center">
                <span class="text-primary-foreground font-bold text-sm">M</span>
              </div>
              <span class="text-foreground tracking-tight font-serif text-xl">
                Mentor<span class="text-primary">chief</span>
              </span>
            </a>

            @if (user$ | async; as user) {
              <div class="relative">
                <button
                  type="button"
                  (click)="dropdownOpen = !dropdownOpen; $event.stopPropagation()"
                  class="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  @if (isAvatarUrl(user.avatar)) {
                    <img [src]="user.avatar" [alt]="user.name" class="w-8 h-8 rounded-md object-cover" />
                  } @else {
                    <div class="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                      <span class="text-primary-foreground text-xs font-medium">{{ getInitials(user.name) }}</span>
                    </div>
                  }
                  <div class="hidden sm:block text-left">
                    <p class="text-sm text-foreground leading-tight">{{ user.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ user.email }}</p>
                  </div>
                  <fa-icon [icon]="['fas', 'chevron-down']" class="text-muted-foreground text-xs w-3 h-3 transition-transform" [class.rotate-180]="dropdownOpen" />
                </button>

                @if (dropdownOpen) {
                  <div class="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-lg border border-border shadow-lg py-1.5 z-50">
                    <div class="px-3 py-2 border-b border-border mb-1">
                      <p class="text-sm text-foreground truncate">{{ user.name }}</p>
                      <p class="text-xs text-muted-foreground truncate">{{ user.email }}</p>
                    </div>
                    <button
                      type="button"
                      (click)="onLogout()"
                      class="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <fa-icon [icon]="['fas', 'right-from-bracket']" class="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 py-8">
        <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <router-outlet />
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-border py-4">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p class="text-center text-xs text-muted-foreground">
            Having trouble? <a href="mailto:support@mentorchief.com" class="text-primary hover:underline">Contact Support</a>
          </p>
        </div>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationLayoutComponent implements OnInit {
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);

  readonly currentStep$: Observable<number> = this.store.select(selectRegistrationCurrentStep);
  readonly totalSteps$: Observable<number> = this.store.select(selectRegistrationTotalSteps);
  readonly data$: Observable<RegistrationData> = this.store.select(selectRegistrationData);
  readonly isAuthenticated$: Observable<boolean> = this.store.select(selectIsAuthenticated);
  readonly user$: Observable<User | null> = this.store.select(selectAuthUser);

  dropdownOpen = false;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.dropdownOpen = false;
  }

  private currentStepValue = 1;
  private totalStepsValue = 5;

  ngOnInit(): void {
    this.store.dispatch(hydrateFromSession());

    this.currentStep$.subscribe((step) => {
      this.currentStepValue = step;
    });

    this.totalSteps$.subscribe((total) => {
      this.totalStepsValue = total;
    });

    this.isAuthenticated$.pipe(take(1)).subscribe((isAuth) => {
      if (!isAuth) {
        void this.router.navigate([ROUTES.signup]);
      }
    });
  }

  readonly ROUTES = ROUTES;

  isAvatarUrl(avatar: string | undefined): boolean {
    return !!avatar && (avatar.startsWith('http') || avatar.startsWith('/'));
  }

  onLogout(): void {
    this.store.dispatch(logout());
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getSteps(): StepInfo[] {
    const isMentor = this.totalStepsValue === 6;
    const steps: StepInfo[] = [
      { number: 1, label: 'Role', path: 'role-info' },
      { number: 2, label: 'Personal', path: 'personal-info' },
      { number: 3, label: 'Career', path: 'career-info' },
      { number: 4, label: 'Bio & Skills', path: 'biography' },
    ];

    if (isMentor) {
      steps.push({ number: 5, label: 'Preferences', path: 'preference' });
      steps.push({ number: 6, label: 'Review', path: 'preview' });
    } else {
      steps.push({ number: 5, label: 'Review', path: 'preview' });
    }

    return steps;
  }

  isCurrentStep(stepNumber: number): boolean {
    return this.currentStepValue === stepNumber;
  }

  isStepCompleted(stepNumber: number): boolean {
    return this.currentStepValue > stepNumber;
  }

  getStepClass(stepNumber: number): string {
    if (this.isStepCompleted(stepNumber)) {
      return 'bg-primary text-primary-foreground';
    }
    if (this.isCurrentStep(stepNumber)) {
      return 'bg-primary text-primary-foreground';
    }
    return 'bg-muted text-muted-foreground';
  }
}
