import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthFacade } from '../facades/auth.facade';
import { RegistrationFacade } from '../facades/registration.facade';
import { ROUTES } from '../routes';

@Component({
  selector: 'mc-registration-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen bg-background flex flex-col">
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
            @if (auth.currentUser$ | async; as user) {
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <span class="text-primary-foreground text-xs font-medium">{{ getInitials(user.name) }}</span>
                </div>
                <div class="hidden sm:block">
                  <p class="text-sm text-foreground leading-tight">{{ user.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ user.email }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </header>
      <main class="flex-1 py-8">
        <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <router-outlet />
        </div>
      </main>
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
  readonly auth = inject(AuthFacade);
  private readonly reg = inject(RegistrationFacade);
  private readonly router = inject(Router);
  readonly ROUTES = ROUTES;

  ngOnInit(): void {
    if (!this.auth.isAuthenticated) {
      void this.router.navigate([ROUTES.signup]);
      return;
    }
    this.reg.hydrate();
  }

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
