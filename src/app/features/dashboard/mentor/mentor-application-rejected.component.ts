import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectAuthUser } from '../../auth/store/auth.selectors';
import { updateData, setCurrentStep } from '../../registration/store/registration.actions';
import type { User } from '../../../core/models/user.model';
import { UserRole } from '../../../core/models/user.model';

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
        <p class="text-muted-foreground mb-4 leading-relaxed">
          Unfortunately, your mentor application was not approved at this time.
        </p>
        @if (rejectionReason) {
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p class="text-sm font-medium text-red-800 mb-1">Reason</p>
            <p class="text-sm text-red-700 leading-relaxed">{{ rejectionReason }}</p>
          </div>
        }
        <p class="text-muted-foreground mb-6 text-sm leading-relaxed">
          You can update your profile and reapply, or contact support for more information.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            routerLink="/"
            class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 no-underline inline-block text-center"
          >
            Back to home
          </a>
          <button
            type="button"
            (click)="onReapply()"
            class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 inline-block text-center"
          >
            Reapply
          </button>
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
export class MentorApplicationRejectedComponent {
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);

  rejectionReason = '';
  private user: User | null = null;

  constructor() {
    this.store.select(selectAuthUser).pipe(take(1)).subscribe((user) => {
      this.user = user;
      this.rejectionReason = user?.rejectionReason ?? '';
    });
  }

  onReapply(): void {
    if (!this.user) return;

    const [firstName, ...lastNameParts] = (this.user.name ?? '').split(' ');

    this.store.dispatch(updateData({
      updates: {
        role: UserRole.Mentor,
        firstName: firstName ?? '',
        lastName: lastNameParts.join(' ') ?? '',
        phone: this.user.phone ?? '',
        location: this.user.location ?? '',
        gender: this.user.gender ?? '',
        photo: this.user.avatar ?? null,
        jobTitle: this.user.jobTitle ?? '',
        company: this.user.company ?? '',
        yearsOfExperience: this.user.yearsOfExperience ?? '',
        bio: this.user.bio ?? '',
        skills: this.user.skills ?? [],
        tools: this.user.tools ?? [],
        portfolioUrl: this.user.portfolioUrl ?? '',
        experiences: this.user.experiences ?? [],
        subscriptionCost: this.user.subscriptionCost ?? '',
        mentorPlans: this.user.mentorPlans ?? [],
        availability: this.user.availability ?? [],
        menteeCapacity: this.user.menteeCapacity ?? '',
      },
    }));

    this.store.dispatch(setCurrentStep({ step: 1 }));
    void this.router.navigate(['/auth/registration-steps/role-info']);
  }
}
