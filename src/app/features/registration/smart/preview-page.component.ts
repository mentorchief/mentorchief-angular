import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { RegistrationFacade } from '../../../core/facades/registration.facade';
import { ROLE_DISPLAY_LABELS, UserRole } from '../../../core/models/user.model';
import { DEFAULT_MENTEE_CAPACITY } from '../../../core/constants';
import { ROUTES } from '../../../core/routes';

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
        <div class="space-y-4">
          <div class="flex items-center justify-between"><h3 class="text-primary font-medium">Personal Information</h3><button type="button" (click)="handleEdit(2)" class="text-sm text-primary hover:underline">Edit</button></div>
          <div class="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <div class="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-xl font-semibold">{{ data.firstName[0] }}{{ data.lastName[0] }}</div>
            <div class="flex-1 space-y-2">
              <h4 class="font-medium text-foreground">{{ data.firstName }} {{ data.lastName }}</h4>
              <div class="space-y-1 text-sm text-muted-foreground">
                <div class="flex items-center gap-2"><fa-icon [icon]="['fas', 'user']" class="w-4 h-4" /><span class="capitalize">{{ data.gender || 'Not specified' }}</span></div>
                <div class="flex items-center gap-2"><span>📞</span><span>{{ data.phone }}</span></div>
                <div class="flex items-center gap-2"><span>📍</span><span>{{ data.location }}</span></div>
              </div>
            </div>
            <span class="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">{{ ROLE_DISPLAY_LABELS[data.role ?? UserRole.Mentee] }}</span>
          </div>
        </div>
        <hr class="border-border" />
        <div class="space-y-4">
          <div class="flex items-center justify-between"><h3 class="text-primary font-medium">Career Information</h3><button type="button" (click)="handleEdit(3)" class="text-sm text-primary hover:underline">Edit</button></div>
          <div class="space-y-3">
            <div class="flex items-start gap-3"><fa-icon [icon]="['fas', 'briefcase']" class="text-primary w-4 h-4" /><div><p class="font-medium text-foreground">{{ data.jobTitle }}</p><p class="text-sm text-muted-foreground">{{ data.company }}</p></div></div>
            <div class="flex items-start gap-3"><fa-icon [icon]="['fas', 'calendar']" class="text-primary w-4 h-4" /><div><p class="text-sm text-foreground"><span class="font-medium">{{ data.yearsOfExperience }} years</span> of professional experience</p></div></div>
            @if (data.experiences.length) {
              <div class="mt-4 space-y-3">
                <p class="text-sm font-medium text-foreground">Work history</p>
                @for (exp of data.experiences; track exp.id) {
                  <div class="p-3 rounded-lg border border-border bg-background/50 text-sm">
                    <p class="font-medium text-foreground">{{ exp.title }} <span class="text-muted-foreground font-normal">· {{ exp.company }}</span></p>
                    <p class="text-xs text-muted-foreground mt-0.5">{{ exp.startDate }}{{ exp.current ? ' – Present' : (exp.endDate ? ' – ' + exp.endDate : '') }}</p>
                    @if (exp.description) { <p class="text-muted-foreground mt-2 leading-relaxed">{{ exp.description }}</p> }
                  </div>
                }
              </div>
            }
          </div>
        </div>
        <hr class="border-border" />
        <div class="space-y-4">
          <div class="flex items-center justify-between"><h3 class="text-primary font-medium">Biography & Expertise</h3><button type="button" (click)="handleEdit(4)" class="text-sm text-primary hover:underline">Edit</button></div>
          <div class="space-y-4">
            <div><p class="text-sm font-medium text-foreground mb-2">Biography</p><p class="text-sm text-muted-foreground leading-relaxed">{{ data.bio }}</p></div>
            <div><p class="text-sm font-medium text-foreground mb-2">Skills ({{ data.skills.length }})</p><div class="flex flex-wrap gap-2">@for (skill of data.skills; track skill) { <span class="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">{{ skill }}</span> }</div></div>
            @if (data.tools.length > 0) { <div><p class="text-sm font-medium text-foreground mb-2">Tools & Technologies</p><div class="flex flex-wrap gap-2">@for (tool of data.tools; track tool) { <span class="px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm">{{ tool }}</span> }</div></div> }
            @if (data.portfolioUrl) {
              <div class="flex items-center gap-2 flex-wrap">
                <fa-icon [icon]="['fab', 'linkedin']" class="text-primary w-4 h-4" />
                <span class="text-sm font-medium text-foreground">LinkedIn profile</span>
                <a [href]="data.portfolioUrl" target="_blank" rel="noopener noreferrer" class="text-sm text-primary hover:underline break-all">{{ data.portfolioUrl }}</a>
              </div>
            }
          </div>
        </div>
        @if (data.role === UserRole.Mentor) {
          <hr class="border-border" />
          <div class="space-y-4">
            <div class="flex items-center justify-between"><h3 class="text-primary font-medium">Mentorship Preferences</h3><button type="button" (click)="handleEdit(5)" class="text-sm text-primary hover:underline">Edit</button></div>
            <div class="grid md:grid-cols-2 gap-4">
              <div class="flex items-start gap-3"><fa-icon [icon]="['fas', 'dollar-sign']" class="text-primary w-4 h-4" /><div><p class="text-sm font-medium text-foreground">Pricing Plans</p><div class="flex flex-wrap gap-2 mt-1">@for (plan of data.mentorPlans; track plan.id) { <span class="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">{{ plan.duration === 'monthly' ? 'Monthly' : plan.duration === 'quarterly' ? 'Quarterly' : '6 months' }} · {{ '$' + plan.price }}</span> }</div></div></div>
              <div class="flex items-start gap-3"><fa-icon [icon]="['fas', 'users']" class="text-primary w-4 h-4" /><div><p class="text-sm font-medium text-foreground">Mentee Capacity</p><p class="text-sm text-muted-foreground">Up to {{ data.menteeCapacity || defaultMenteeCapacityStr }} mentees at a time</p></div></div>
            </div>
          </div>
        }
        @if (error) { <div class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"><p class="text-sm text-destructive">{{ error }}</p></div> }
        <div class="flex justify-between pt-4">
          <button type="button" (click)="onBack()" class="py-2.5 px-5 border border-border text-foreground rounded-md hover:bg-muted transition-colors">Back</button>
          <button type="button" (click)="onSubmit()" [disabled]="isSubmitting" class="py-2.5 px-6 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 min-w-40 transition-opacity">{{ isSubmitting ? 'Submitting...' : 'Complete Registration' }}</button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewPageComponent {
  private readonly auth = inject(AuthFacade);
  private readonly reg = inject(RegistrationFacade);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  get data() { return this.reg.data; }
  readonly ROLE_DISPLAY_LABELS = ROLE_DISPLAY_LABELS;
  readonly UserRole = UserRole;
  readonly defaultMenteeCapacityStr = String(DEFAULT_MENTEE_CAPACITY);
  isSubmitting = false;
  error = '';

  handleEdit(step: number): void {
    this.reg.setStep(step);
    const paths = [ROUTES.registration.roleInfo, ROUTES.registration.personalInfo, ROUTES.registration.careerInfo, ROUTES.registration.biography, ...(this.data.role === UserRole.Mentor ? [ROUTES.registration.preference] : [])];
    void this.router.navigate([paths[step - 1]]);
  }

  onBack(): void {
    this.handleEdit(this.data.role === UserRole.Mentor ? 5 : 4);
  }

  onSubmit(): void {
    const user = this.auth.currentUser;
    if (!user) { this.error = 'You must be logged in to complete registration.'; return; }
    this.isSubmitting = true;
    this.error = '';

    const fullName = `${this.data.firstName} ${this.data.lastName}`.trim() || user.name;
    const initials = fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    const experiences =
      this.data.role === UserRole.Mentor
        ? (this.data.experiences ?? []).filter((e) =>
            [e.title, e.company, e.startDate, e.endDate, e.description].some((x) => String(x ?? '').trim()),
          )
        : [];
    const profile: Record<string, unknown> = {
      name: fullName,
      firstName: this.data.firstName.trim() || undefined,
      lastName: this.data.lastName.trim() || undefined,
      avatar: this.data.photo || initials,
      role: this.data.role ?? user.role,
      phone: this.data.phone || undefined,
      location: this.data.location || undefined,
      gender: this.data.gender || undefined,
      jobTitle: this.data.jobTitle || undefined,
      company: this.data.company || undefined,
      yearsOfExperience: this.data.yearsOfExperience || undefined,
      bio: this.data.bio || undefined,
      skills: this.data.skills.length ? this.data.skills : undefined,
      tools: this.data.tools.length ? this.data.tools : undefined,
      experiences: experiences.length ? experiences.map((e) => ({ ...e })) : undefined,
    };

    if (this.data.role === UserRole.Mentor) {
      profile['linkedin'] = this.data.portfolioUrl?.trim() || undefined;
      profile['portfolioUrl'] = undefined;
      profile['subscriptionCost'] = this.data.subscriptionCost || undefined;
      profile['mentorPlans'] = this.data.mentorPlans.length ? this.data.mentorPlans : undefined;
      profile['menteeCapacity'] =
        this.data.menteeCapacity?.trim() ? this.data.menteeCapacity : String(DEFAULT_MENTEE_CAPACITY);
      profile['mentorApprovalStatus'] = 'pending';
    } else {
      profile['linkedin'] = this.data.portfolioUrl?.trim() || undefined;
      profile['portfolioUrl'] = undefined;
    }

    this.auth.markRegistered(profile as Parameters<typeof this.auth.markRegistered>[0]);
    sessionStorage.removeItem('mentorchief_signup_temp');
    this.reg.reset();
    this.toast.success('Registration complete! Welcome to Mentorchief.');

    setTimeout(() => {
      this.isSubmitting = false;
      void this.router.navigate([this.data.role === UserRole.Mentor ? ROUTES.mentor.pending : ROUTES.browse]);
    }, 800);
  }
}
