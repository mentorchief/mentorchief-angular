import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastService } from '../../../shared/services/toast.service';
import { take } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectRegistrationData } from '../store/registration.selectors';
import { selectAuthUser } from '../../auth/store/auth.selectors';
import { resetData, setCurrentStep } from '../store/registration.actions';
import { markRegistered } from '../../auth/store/auth.actions';
import type { RegistrationData } from '../../../core/models/registration.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'mc-preview-page',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="bg-card border border-primary/20 rounded-lg overflow-hidden pb-8">
      <div class="p-6 border-b border-border">
        <h2 class="text-lg text-foreground">Review Your Information</h2>
        <p class="text-sm text-muted-foreground mt-1">Please review all details before completing registration</p>
      </div>
      <div class="p-6 space-y-6">
        <!-- Personal Information -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-primary font-medium">Personal Information</h3>
            <button
              type="button"
              (click)="handleEdit(2)"
              class="text-sm text-primary hover:underline"
            >
              Edit
            </button>
          </div>
          <div class="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <div class="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-xl font-semibold">
              {{ data.firstName[0] }}{{ data.lastName[0] }}
            </div>
            <div class="flex-1 space-y-2">
              <h4 class="font-medium text-foreground">{{ data.firstName }} {{ data.lastName }}</h4>
              <div class="space-y-1 text-sm text-muted-foreground">
                <div class="flex items-center gap-2">
                  <fa-icon [icon]="['fas', 'user']" class="w-4 h-4" />
                  <span class="capitalize">{{ data.gender || 'Not specified' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span>📞</span>
                  <span>{{ data.phone }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span>📍</span>
                  <span>{{ data.location }}</span>
                </div>
              </div>
            </div>
            <span class="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
              {{ data.role === 'mentor' ? 'Mentor' : 'Mentee' }}
            </span>
          </div>
        </div>

        <hr class="border-border" />

        <!-- Career Information -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-primary font-medium">Career Information</h3>
            <button
              type="button"
              (click)="handleEdit(3)"
              class="text-sm text-primary hover:underline"
            >
              Edit
            </button>
          </div>
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <fa-icon [icon]="['fas', 'briefcase']" class="text-primary w-4 h-4" />
              <div>
                <p class="font-medium text-foreground">{{ data.jobTitle }}</p>
                <p class="text-sm text-muted-foreground">{{ data.company }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <fa-icon [icon]="['fas', 'calendar']" class="text-primary w-4 h-4" />
              <div>
                <p class="text-sm text-foreground">
                  <span class="font-medium">{{ data.yearsOfExperience }} years</span> of professional experience
                </p>
              </div>
            </div>
          </div>
        </div>

        <hr class="border-border" />

        <!-- Biography & Skills -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-primary font-medium">Biography & Expertise</h3>
            <button
              type="button"
              (click)="handleEdit(4)"
              class="text-sm text-primary hover:underline"
            >
              Edit
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <p class="text-sm font-medium text-foreground mb-2">Biography</p>
              <p class="text-sm text-muted-foreground leading-relaxed">{{ data.bio }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-foreground mb-2">Skills ({{ data.skills.length }})</p>
              <div class="flex flex-wrap gap-2">
                @for (skill of data.skills; track skill) {
                  <span class="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">{{ skill }}</span>
                }
              </div>
            </div>
            @if (data.tools.length > 0) {
              <div>
                <p class="text-sm font-medium text-foreground mb-2">Tools & Technologies</p>
                <div class="flex flex-wrap gap-2">
                  @for (tool of data.tools; track tool) {
                    <span class="px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm">{{ tool }}</span>
                  }
                </div>
              </div>
            }
            @if (data.portfolioUrl) {
              <div class="flex items-center gap-2">
                <fa-icon [icon]="['fas', 'link']" class="text-primary w-4 h-4" />
                <a [href]="data.portfolioUrl" target="_blank" class="text-sm text-primary hover:underline">
                  {{ data.portfolioUrl }}
                </a>
              </div>
            }
          </div>
        </div>

        <!-- Mentor Preferences -->
        @if (data.role === 'mentor') {
          <hr class="border-border" />
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-primary font-medium">Mentorship Preferences</h3>
              <button
                type="button"
                (click)="handleEdit(5)"
                class="text-sm text-primary hover:underline"
              >
                Edit
              </button>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
              <div class="flex items-start gap-3">
                <fa-icon [icon]="['fas', 'dollar-sign']" class="text-primary w-4 h-4" />
                <div>
                  <p class="text-sm font-medium text-foreground">Pricing Plans</p>
                  @if (data.mentorPlans.length === 0) {
                    <p class="text-sm text-muted-foreground">No plans configured</p>
                  } @else {
                    <div class="flex flex-wrap gap-2 mt-1">
                      @for (plan of data.mentorPlans; track plan.id) {
                        <span class="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                          {{ plan.duration === 'monthly' ? 'Monthly' : plan.duration === 'quarterly' ? 'Quarterly' : '6 months' }} · \${{ plan.price }}
                        </span>
                      }
                    </div>
                  }
                </div>
              </div>
              <div class="flex items-start gap-3">
                <fa-icon [icon]="['fas', 'users']" class="text-primary w-4 h-4" />
                <div>
                  <p class="text-sm font-medium text-foreground">Mentee Capacity</p>
                  <p class="text-sm text-muted-foreground">{{ data.menteeCapacity }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <fa-icon [icon]="['fas', 'calendar']" class="text-primary w-4 h-4" />
                <div>
                  <p class="text-sm font-medium text-foreground">Availability Slots</p>
                  <p class="text-sm text-muted-foreground">{{ data.availability.length }} slots selected</p>
                </div>
              </div>
            </div>
            @if (data.availability.length > 0) {
              <div>
                <p class="text-sm font-medium text-foreground mb-2">Available Times</p>
                <div class="flex flex-wrap gap-2">
                  @for (slot of data.availability.slice(0, 5); track slot) {
                    <span class="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs">{{ slot }}</span>
                  }
                  @if (data.availability.length > 5) {
                    <span class="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs">+{{ data.availability.length - 5 }} more</span>
                  }
                </div>
              </div>
            }
          </div>
        }

        @if (error) {
          <div class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p class="text-sm text-destructive">{{ error }}</p>
          </div>
        }

        <!-- Submit Button -->
        <div class="flex justify-between pt-4">
          <button
            type="button"
            (click)="onBack()"
            class="py-2.5 px-5 border border-border text-foreground rounded-md hover:bg-muted transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            (click)="onSubmit()"
            [disabled]="isSubmitting"
            class="py-2.5 px-6 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 min-w-40 transition-opacity"
          >
            {{ isSubmitting ? 'Submitting...' : 'Complete Registration' }}
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewPageComponent {
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  data: RegistrationData = {
    role: null,
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    gender: '',
    photo: '',
    jobTitle: '',
    company: '',
    yearsOfExperience: '',
    experiences: [],
    bio: '',
    skills: [],
    tools: [],
    portfolioUrl: '',
    subscriptionCost: '',
    mentorPlans: [],
    availability: [],
    menteeCapacity: '',
  };

  user: User | null = null;
  isSubmitting = false;
  error = '';

  constructor() {
    this.store.select(selectRegistrationData).pipe(take(1)).subscribe((d) => {
      this.data = d;
    });
    this.store.select(selectAuthUser).pipe(take(1)).subscribe((u) => {
      this.user = u;
    });
  }

  handleEdit(step: number): void {
    this.store.dispatch(setCurrentStep({ step }));
    const paths = [
      '/auth/registration-steps/role-info',
      '/auth/registration-steps/personal-info',
      '/auth/registration-steps/career-info',
      '/auth/registration-steps/biography',
      ...(this.data.role === 'mentor' ? ['/auth/registration-steps/preference'] : []),
    ];
    void this.router.navigate([paths[step - 1]]);
  }

  onBack(): void {
    if (this.data.role === 'mentor') {
      this.handleEdit(5);
    } else {
      this.handleEdit(4);
    }
  }

  onSubmit(): void {
    if (!this.user) {
      this.error = 'You must be logged in to complete registration.';
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    const fullName = `${this.data.firstName} ${this.data.lastName}`.trim() || this.user.name;
    const initials = fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const profile: Record<string, unknown> = {
      name: fullName,
      avatar: this.data.photo || initials,
      role: this.data.role ?? this.user.role,
      phone: this.data.phone || undefined,
      location: this.data.location || undefined,
      gender: this.data.gender || undefined,
      jobTitle: this.data.jobTitle || undefined,
      company: this.data.company || undefined,
      yearsOfExperience: this.data.yearsOfExperience || undefined,
      bio: this.data.bio || undefined,
      skills: this.data.skills.length ? this.data.skills : undefined,
      tools: this.data.tools.length ? this.data.tools : undefined,
      portfolioUrl: this.data.portfolioUrl || undefined,
    };

    if (this.data.role === 'mentor') {
      profile['subscriptionCost'] = this.data.subscriptionCost || undefined;
      profile['mentorPlans'] = this.data.mentorPlans.length ? this.data.mentorPlans : undefined;
      profile['availability'] = this.data.availability.length ? this.data.availability : undefined;
      profile['menteeCapacity'] = this.data.menteeCapacity || undefined;
      profile['mentorApprovalStatus'] = 'pending';
    }

    this.store.dispatch(markRegistered({ updates: profile as Partial<User> }));
    sessionStorage.removeItem('mentorchief_signup_temp');
    this.store.dispatch(resetData());
    this.toast.success('Registration complete! Welcome to Mentorchief.');

    setTimeout(() => {
      this.isSubmitting = false;
      if (this.data.role === 'mentor') {
        void this.router.navigate(['/dashboard/mentor/pending']);
      } else {
        void this.router.navigate(['/browse']);
      }
    }, 800);
  }
}
