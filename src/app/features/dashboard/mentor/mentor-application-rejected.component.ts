import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'mc-mentor-application-rejected',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-[60vh] flex items-center justify-center p-6">
      <div class="max-w-lg w-full bg-card rounded-xl border border-border shadow-sm p-8 text-center">
        <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <fa-icon [icon]="['fas', 'circle-xmark']" class="text-2xl text-red-600" />
        </div>
        <h1 class="text-2xl font-semibold text-foreground mb-2">Application not approved</h1>
        <p class="text-muted-foreground mb-6 leading-relaxed">
          Unfortunately, your mentor application was not approved at this time. If you have questions or would like to reapply, please contact support.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            routerLink="/"
            class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 no-underline inline-block text-center"
          >
            Back to home
          </a>
          <a
            href="mailto:support@mentorchief.com"
            class="px-5 py-2.5 border border-border text-foreground rounded-md font-medium hover:bg-muted no-underline inline-block text-center"
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  `,
})
export class MentorApplicationRejectedComponent {}
