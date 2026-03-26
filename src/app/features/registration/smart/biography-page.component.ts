import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectRegistrationData } from '../store/registration.selectors';
import { UserRole } from '../../../core/models/user.model';
import { updateData, setCurrentStep } from '../store/registration.actions';
import { ROUTES } from '../../../core/routes';
import { AuthApiService } from '../../../core/services/auth-api.service';

interface BioFormData {
  bio: string;
  skills: string[];
  tools: string[];
  portfolioUrl: string;
  expertiseCategory: string;
}

@Component({
  selector: 'mc-biography-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="bg-card border border-primary/20 rounded-lg overflow-hidden">
      <div class="p-6 border-b border-border">
        <h2 class="text-lg text-foreground">
          {{ isMentor ? 'Biography & Expertise' : 'About You' }}
        </h2>
        <p class="text-sm text-muted-foreground mt-1">
          {{ isMentor ? 'Share your professional story and areas of expertise' : 'Tell us about yourself and what you want to learn' }}
        </p>
      </div>
      <div class="p-6 space-y-6">
        <!-- Primary Expertise Category (Mentor only) -->
        @if (isMentor) {
          <div class="space-y-2">
            <label class="block text-sm font-medium text-foreground">
              Primary Expertise Category <span class="text-destructive">*</span>
            </label>
            <select
              [(ngModel)]="formData.expertiseCategory"
              [class.border-destructive]="errors['expertiseCategory']"
              class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            >
              <option value="">Select a category</option>
              @for (cat of expertiseCategories; track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
            @if (errors['expertiseCategory']) {
              <p class="text-sm text-destructive">{{ errors['expertiseCategory'] }}</p>
            }
          </div>
        }

        <!-- Bio -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">
            {{ isMentor ? 'Professional Biography' : 'About Me' }} <span class="text-destructive">*</span>
          </label>
          <textarea
            [(ngModel)]="formData.bio"
            rows="6"
            [placeholder]="isMentor ? 'Tell us about your professional journey...' : 'Tell us about yourself and your goals...'"
            [class.border-destructive]="errors['bio']"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          ></textarea>
          <div class="flex justify-between items-center">
            <p class="text-xs text-muted-foreground">{{ formData.bio.length }} / 500 characters (minimum 50)</p>
            @if (errors['bio']) {
              <p class="text-sm text-destructive">{{ errors['bio'] }}</p>
            }
          </div>
        </div>

        <!-- Skills -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">
            {{ isMentor ? 'Skills' : 'Skills & Interests' }} <span class="text-destructive">*</span>
          </label>
          <p class="text-xs text-muted-foreground">Press Enter to add skills</p>
          <input
            type="text"
            [(ngModel)]="skillInput"
            (keydown.enter)="addSkill($event)"
            placeholder="Type a skill and press Enter"
            [class.border-destructive]="errors['skills']"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
          @if (errors['skills']) {
            <p class="text-sm text-destructive">{{ errors['skills'] }}</p>
          }
          @if (formData.skills.length > 0) {
            <div class="flex flex-wrap gap-2 mt-3">
              @for (skill of formData.skills; track skill) {
                <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm">
                  {{ skill }}
                  <button type="button" (click)="removeSkill(skill)" class="hover:text-primary"><fa-icon [icon]="['fas', 'xmark']" class="w-3.5 h-3.5" /></button>
                </span>
              }
            </div>
          }
        </div>

        <!-- Tools -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">
            {{ isMentor ? 'Tools & Technologies' : 'Tools & Technologies (Optional)' }}
          </label>
          <input
            type="text"
            [(ngModel)]="toolInput"
            (keydown.enter)="addTool($event)"
            placeholder="Type a tool and press Enter"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
          @if (formData.tools.length > 0) {
            <div class="flex flex-wrap gap-2 mt-3">
              @for (tool of formData.tools; track tool) {
                <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground rounded-md text-sm">
                  {{ tool }}
                  <button type="button" (click)="removeTool(tool)" class="hover:text-foreground"><fa-icon [icon]="['fas', 'xmark']" class="w-3.5 h-3.5" /></button>
                </span>
              }
            </div>
          }
        </div>

        <!-- Portfolio URL -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">
            {{ isMentor ? 'Portfolio / Website URL' : 'Portfolio / LinkedIn (Optional)' }}
          </label>
          <input
            type="url"
            [(ngModel)]="formData.portfolioUrl"
            placeholder="https://yourportfolio.com"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
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
export class BiographyPageComponent implements OnInit {
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  formData: BioFormData = {
    bio: '',
    skills: [],
    tools: [],
    portfolioUrl: '',
    expertiseCategory: '',
  };

  skillInput = '';
  toolInput = '';
  errors: Record<string, string> = {};
  isMentor = false;
  expertiseCategories: { id: string; name: string }[] = [];

  constructor() {
    this.store.select(selectRegistrationData).pipe(take(1)).subscribe((data) => {
      this.isMentor = data.role === UserRole.Mentor;
      this.formData = {
        bio: data.bio,
        skills: [...data.skills],
        tools: [...data.tools],
        portfolioUrl: data.portfolioUrl,
        expertiseCategory: data.expertiseCategory,
      };
    });
  }

  ngOnInit(): void {
    if (this.isMentor) {
      this.authApi.getExpertiseCategories().pipe(take(1)).subscribe((categories) => {
        this.expertiseCategories = categories;
        this.cdr.markForCheck();
      });
    }
  }

  addSkill(event: Event): void {
    event.preventDefault();
    const value = this.skillInput.trim();
    if (value && !this.formData.skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      this.formData.skills = [...this.formData.skills, value];
    }
    this.skillInput = '';
  }

  removeSkill(skill: string): void {
    this.formData.skills = this.formData.skills.filter((s) => s !== skill);
  }

  addTool(event: Event): void {
    event.preventDefault();
    const value = this.toolInput.trim();
    if (value && !this.formData.tools.some((t) => t.toLowerCase() === value.toLowerCase())) {
      this.formData.tools = [...this.formData.tools, value];
    }
    this.toolInput = '';
  }

  removeTool(tool: string): void {
    this.formData.tools = this.formData.tools.filter((t) => t !== tool);
  }

  validate(): boolean {
    this.errors = {};
    if (this.isMentor && !this.formData.expertiseCategory) {
      this.errors['expertiseCategory'] = 'Please select a primary expertise category';
    }
    if (!this.formData.bio.trim()) this.errors['bio'] = 'Biography is required';
    else if (this.formData.bio.trim().length < 50) this.errors['bio'] = 'Biography must be at least 50 characters';
    if (this.formData.skills.length === 0) this.errors['skills'] = 'Add at least one skill';
    return Object.keys(this.errors).length === 0;
  }

  onBack(): void {
    this.store.dispatch(updateData({ updates: this.formData }));
    this.store.dispatch(setCurrentStep({ step: 3 }));
    void this.router.navigate([ROUTES.registration.careerInfo]);
  }

  onNext(): void {
    if (this.validate()) {
      this.store.dispatch(updateData({ updates: this.formData }));
      this.store.dispatch(setCurrentStep({ step: 5 }));
      if (this.isMentor) {
        void this.router.navigate([ROUTES.registration.preference]);
      } else {
        void this.router.navigate([ROUTES.registration.preview]);
      }
    }
  }
}
