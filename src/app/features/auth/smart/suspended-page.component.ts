import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'mc-suspended-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-[70vh] flex items-center justify-center p-6">
      <div class="max-w-lg w-full bg-card rounded-xl border border-border shadow-sm p-8 text-center">
        <div class="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <fa-icon [icon]="['fas', 'ban']" class="text-2xl text-destructive" />
        </div>
        <h1 class="text-2xl font-semibold text-foreground mb-2">Account suspended</h1>
        <p class="text-muted-foreground mb-6 leading-relaxed">
          Your account has been suspended. If you believe this is a mistake or would like more information, please contact our support team.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@mentorchief.com"
            class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 no-underline inline-block text-center"
          >
            Contact support
          </a>
          <a
            routerLink="/"
            class="px-5 py-2.5 border border-border text-foreground rounded-md font-medium hover:bg-muted no-underline inline-block text-center"
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  `,
})
export class SuspendedPageComponent {}
