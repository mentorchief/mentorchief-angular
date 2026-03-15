import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { AppState } from '../../../store/app.state';
import { selectAuthUser } from '../../auth/store/auth.selectors';
import { Observable } from 'rxjs';

@Component({
  selector: 'mc-mentor-application-pending',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-[60vh] flex items-center justify-center p-6">
      <div class="max-w-lg w-full bg-card rounded-xl border border-border shadow-sm p-8 text-center">
        <div class="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <fa-icon [icon]="['fas', 'clock']" class="text-2xl text-amber-600" />
        </div>
        <h1 class="text-2xl font-semibold text-foreground mb-2">Application under review</h1>
        <p class="text-muted-foreground mb-6 leading-relaxed">
          Thank you for applying to become a mentor. Your application is being reviewed by our team.
          An admin will approve or reject it shortly. You’ll be able to access your mentor dashboard once approved.
        </p>
        <p class="text-sm text-muted-foreground mb-8">
          You can refresh this page to check your status, or sign out and return later.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            (click)="refresh()"
            class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90"
          >
            Refresh status
          </button>
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
export class MentorApplicationPendingComponent {
  private readonly store = inject(Store<AppState>);
  user$: Observable<{ name: string } | null> = this.store.select(selectAuthUser);

  refresh(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}
