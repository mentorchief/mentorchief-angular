import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectRegistrationData } from '../store/registration.selectors';
import { UserRole } from '../../../core/models/user.model';
import { updateData, setCurrentStep } from '../store/registration.actions';
import { ROUTES } from '../../../core/routes';

interface CareerFormData {
  jobTitle: string;
  company: string;
  yearsOfExperience: string;
}

@Component({
  selector: 'mc-career-info-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-card border border-primary/20 rounded-lg overflow-hidden">
      <div class="p-6 border-b border-border">
        <h2 class="text-lg text-foreground">
          {{ isMentor ? 'Career Information' : 'Background Information' }}
        </h2>
        <p class="text-sm text-muted-foreground mt-1">
          {{ isMentor ? 'Share your professional background' : 'Tell us about your current situation' }}
        </p>
      </div>
      <div class="p-6 space-y-6">
        <!-- Job Title -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">
            {{ isMentor ? 'Current Job Title' : 'Current Role' }} <span class="text-destructive">*</span>
          </label>
          <input
            type="text"
            [(ngModel)]="formData.jobTitle"
            [placeholder]="isMentor ? 'Senior Software Engineer' : 'Student / Junior Developer'"
            [class.border-destructive]="errors['jobTitle']"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
          @if (errors['jobTitle']) {
            <p class="text-sm text-destructive">{{ errors['jobTitle'] }}</p>
          }
        </div>

        <!-- Company -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">
            {{ isMentor ? 'Current Company' : 'Organization / University' }} <span class="text-destructive">*</span>
          </label>
          <input
            type="text"
            [(ngModel)]="formData.company"
            [placeholder]="isMentor ? 'Tech Corp' : 'University / Company'"
            [class.border-destructive]="errors['company']"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
          @if (errors['company']) {
            <p class="text-sm text-destructive">{{ errors['company'] }}</p>
          }
        </div>

        <!-- Years of Experience -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">
            {{ isMentor ? 'Years of Experience' : 'Years in Field' }} <span class="text-destructive">*</span>
          </label>
          <input
            type="number"
            min="0"
            [(ngModel)]="formData.yearsOfExperience"
            [placeholder]="isMentor ? '5' : '0'"
            [class.border-destructive]="errors['yearsOfExperience']"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
          <p class="text-xs text-muted-foreground">
            {{ isMentor ? 'Total years of professional experience' : 'Enter 0 if you are just starting out' }}
          </p>
          @if (errors['yearsOfExperience']) {
            <p class="text-sm text-destructive">{{ errors['yearsOfExperience'] }}</p>
          }
        </div>

        <!-- Navigation Buttons -->
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
            (click)="onNext()"
            class="py-2.5 px-5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareerInfoPageComponent {
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);

  formData: CareerFormData = {
    jobTitle: '',
    company: '',
    yearsOfExperience: '',
  };

  errors: Record<string, string> = {};
  isMentor = false;

  constructor() {
    this.store.select(selectRegistrationData).pipe(take(1)).subscribe((data) => {
      this.isMentor = data.role === UserRole.Mentor;
      this.formData = {
        jobTitle: data.jobTitle,
        company: data.company,
        yearsOfExperience: data.yearsOfExperience,
      };
    });
  }

  validate(): boolean {
    this.errors = {};
    if (!this.formData.jobTitle.trim()) {
      this.errors['jobTitle'] = this.isMentor ? 'Job title is required' : 'Current role is required';
    }
    if (!this.formData.company.trim()) {
      this.errors['company'] = this.isMentor ? 'Company is required' : 'Organization is required';
    }
    if (!this.formData.yearsOfExperience) {
      this.errors['yearsOfExperience'] = 'This field is required';
    }
    return Object.keys(this.errors).length === 0;
  }

  onBack(): void {
    this.store.dispatch(updateData({ updates: this.formData }));
    this.store.dispatch(setCurrentStep({ step: 2 }));
    void this.router.navigate([ROUTES.registration.personalInfo]);
  }

  onNext(): void {
    if (this.validate()) {
      this.store.dispatch(updateData({ updates: this.formData }));
      this.store.dispatch(setCurrentStep({ step: 4 }));
      void this.router.navigate([ROUTES.registration.biography]);
    }
  }
}
