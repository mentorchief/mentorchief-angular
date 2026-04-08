import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RegistrationFacade } from '../../../core/facades/registration.facade';
import type { UserExperience } from '../../../core/models/user.model';
import { UserRole } from '../../../core/models/user.model';
import { ROUTES } from '../../../core/routes';

interface CareerFormData {
  jobTitle: string;
  company: string;
  yearsOfExperience: string;
}

function createEmptyExperience(): UserExperience {
  return {
    id: `exp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  };
}

@Component({
  selector: 'mc-career-info-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="bg-card border border-primary/20 rounded-lg overflow-hidden">
      <div class="p-6 border-b border-border">
        <h2 class="text-lg text-foreground">{{ isMentor ? 'Career Information' : 'Background Information' }}</h2>
        <p class="text-sm text-muted-foreground mt-1">{{ isMentor ? 'Share your professional background' : 'Tell us about your current situation' }}</p>
      </div>
      <div class="p-6 space-y-6">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">{{ isMentor ? 'Current Job Title' : 'Current Role' }} <span class="text-destructive">*</span></label>
          <input type="text" [(ngModel)]="formData.jobTitle" [placeholder]="isMentor ? 'Senior Software Engineer' : 'Student / Junior Developer'" [class.border-destructive]="errors['jobTitle']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
          @if (errors['jobTitle']) { <p class="text-sm text-destructive">{{ errors['jobTitle'] }}</p> }
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">{{ isMentor ? 'Current Company' : 'Organization / University' }} <span class="text-destructive">*</span></label>
          <input type="text" [(ngModel)]="formData.company" [placeholder]="isMentor ? 'Tech Corp' : 'University / Company'" [class.border-destructive]="errors['company']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
          @if (errors['company']) { <p class="text-sm text-destructive">{{ errors['company'] }}</p> }
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">{{ isMentor ? 'Years of Experience' : 'Years in Field' }} <span class="text-destructive">*</span></label>
          <input type="number" min="0" [(ngModel)]="formData.yearsOfExperience" [placeholder]="isMentor ? '5' : '0'" [class.border-destructive]="errors['yearsOfExperience']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
          <p class="text-xs text-muted-foreground">{{ isMentor ? 'Total years of professional experience' : 'Enter 0 if you are just starting out' }}</p>
          @if (errors['yearsOfExperience']) { <p class="text-sm text-destructive">{{ errors['yearsOfExperience'] }}</p> }
        </div>

        @if (isMentor) {
          <div class="border-t border-border pt-6 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 class="text-sm font-medium text-foreground">Work history</h3>
                <p class="text-xs text-muted-foreground mt-0.5">Optional — past or additional roles (same as you can edit later in mentor settings).</p>
              </div>
              <button type="button" (click)="addExperience()" class="py-2 px-4 text-sm border border-border text-foreground rounded-md hover:bg-muted transition-colors shrink-0">
                + Add role
              </button>
            </div>
            @if (errors['experiences']) { <p class="text-sm text-destructive">{{ errors['experiences'] }}</p> }
            @for (exp of experiences; track exp.id; let i = $index) {
              <div class="p-4 border border-border rounded-lg space-y-3 bg-muted/20">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-medium text-muted-foreground">Role {{ i + 1 }}</span>
                  <button type="button" (click)="removeExperience(exp)" class="text-xs text-destructive hover:underline inline-flex items-center gap-1">
                    <fa-icon [icon]="['fas', 'xmark']" class="w-3 h-3" /> Remove
                  </button>
                </div>
                <div class="grid md:grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs text-muted-foreground">Job title</label>
                    <input type="text" [(ngModel)]="exp.title" class="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-md text-sm" placeholder="e.g. Product Manager" />
                  </div>
                  <div>
                    <label class="text-xs text-muted-foreground">Company</label>
                    <input type="text" [(ngModel)]="exp.company" class="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-md text-sm" placeholder="Company name" />
                  </div>
                </div>
                <div class="grid md:grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs text-muted-foreground">Start</label>
                    <input type="text" [(ngModel)]="exp.startDate" class="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-md text-sm" placeholder="e.g. Jan 2020" />
                  </div>
                  <div>
                    <label class="text-xs text-muted-foreground">End</label>
                    <input type="text" [(ngModel)]="exp.endDate" [disabled]="exp.current" class="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-md text-sm disabled:opacity-50" placeholder="e.g. Dec 2023" />
                  </div>
                </div>
                <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" [ngModel]="exp.current" (ngModelChange)="onCurrentToggle(exp, $event)" class="rounded border-border text-primary" />
                  I currently work here
                </label>
                <div>
                  <label class="text-xs text-muted-foreground">Description</label>
                  <textarea [(ngModel)]="exp.description" rows="2" class="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-md text-sm" placeholder="What you did and impact (optional)"></textarea>
                </div>
              </div>
            }
          </div>
        }

        <div class="flex justify-between pt-4">
          <button type="button" (click)="onBack()" class="py-2.5 px-5 border border-border text-foreground rounded-md hover:bg-muted transition-colors">Back</button>
          <button type="button" (click)="onNext()" class="py-2.5 px-5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">Next</button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareerInfoPageComponent {
  private readonly reg = inject(RegistrationFacade);
  private readonly router = inject(Router);

  isMentor = this.reg.data.role === UserRole.Mentor;
  formData: CareerFormData = {
    jobTitle: this.reg.data.jobTitle,
    company: this.reg.data.company,
    yearsOfExperience: String(this.reg.data.yearsOfExperience ?? ''),
  };
  experiences: UserExperience[] =
    this.isMentor && this.reg.data.experiences?.length
      ? this.reg.data.experiences.map((e) => ({ ...e }))
      : [];
  errors: Record<string, string> = {};

  addExperience(): void {
    this.experiences = [...this.experiences, createEmptyExperience()];
  }

  removeExperience(exp: UserExperience): void {
    this.experiences = this.experiences.filter((e) => e.id !== exp.id);
  }

  onCurrentToggle(exp: UserExperience, current: boolean): void {
    exp.current = current;
    if (current) exp.endDate = '';
  }

  private sanitizedExperiences(): UserExperience[] {
    return this.experiences.filter((e) =>
      [e.title, e.company, e.startDate, e.endDate, e.description].some((x) => String(x ?? '').trim()),
    );
  }

  private validateWorkHistory(): boolean {
    const rows = this.sanitizedExperiences();
    for (const e of rows) {
      if (!e.title.trim() || !e.company.trim()) {
        this.errors['experiences'] = 'Each work history entry must include a job title and company (or clear unused rows).';
        return false;
      }
    }
    return true;
  }

  validate(): boolean {
    this.errors = {};
    if (!this.formData.jobTitle.trim()) this.errors['jobTitle'] = this.isMentor ? 'Job title is required' : 'Current role is required';
    if (!this.formData.company.trim()) this.errors['company'] = this.isMentor ? 'Company is required' : 'Organization is required';
    const y = String(this.formData.yearsOfExperience ?? '').trim();
    if (y === '') this.errors['yearsOfExperience'] = 'This field is required';
    if (this.isMentor && !this.validateWorkHistory()) return false;
    return Object.keys(this.errors).length === 0;
  }

  private persistCareerState(): void {
    const years = String(this.formData.yearsOfExperience ?? '').trim();
    this.reg.update({
      ...this.formData,
      yearsOfExperience: years,
      experiences: this.isMentor ? this.sanitizedExperiences() : [],
    });
  }

  onBack(): void {
    this.persistCareerState();
    this.reg.setStep(2);
    void this.router.navigate([ROUTES.registration.personalInfo]);
  }

  onNext(): void {
    if (this.validate()) {
      this.persistCareerState();
      this.reg.setStep(4);
      void this.router.navigate([ROUTES.registration.biography]);
    }
  }
}
