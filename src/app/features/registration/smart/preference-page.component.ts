import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { take } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectRegistrationData } from '../store/registration.selectors';
import { updateData, setCurrentStep } from '../store/registration.actions';
import { ROUTES } from '../../../core/routes';
import type { MentorPlan } from '../../../core/models/registration.model';

interface PreferenceFormData {
  mentorPlans: MentorPlan[];
  availability: string[];
  menteeCapacity: string;
}

@Component({
  selector: 'mc-preference-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="bg-card border border-primary/20 rounded-lg overflow-hidden">
      <div class="p-6 border-b border-border">
        <h2 class="text-lg text-foreground">Mentorship Preferences</h2>
        <p class="text-sm text-muted-foreground mt-1">Configure your pricing plans, capacity, and availability</p>
      </div>
      <div class="p-6 space-y-6">
        <!-- Pricing Plans -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-foreground">
            Pricing Plans <span class="text-destructive">*</span>
          </label>
          <p class="text-sm text-muted-foreground">Add up to 3 subscription plans with your prices.</p>
          @if (errors['mentorPlans']) {
            <p class="text-sm text-destructive">{{ errors['mentorPlans'] }}</p>
          }
          <div class="space-y-3">
            @for (plan of formData.mentorPlans; track plan.id; let i = $index) {
              <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div class="w-full sm:w-40">
                  <label class="text-xs text-muted-foreground">Plan {{ i + 1 }} duration</label>
                  <select
                    [(ngModel)]="plan.duration"
                    class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="6months">6 months</option>
                  </select>
                </div>
                <div class="flex-1 w-full">
                  <label class="text-xs text-muted-foreground">Price (USD)</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      min="1"
                      [(ngModel)]="plan.price"
                      placeholder="299"
                      class="w-full pl-8 pr-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  (click)="onRemovePlan(plan)"
                  [disabled]="formData.mentorPlans.length === 1"
                  class="p-2.5 border border-border rounded-md hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  <fa-icon [icon]="['fas', 'xmark']" class="w-4 h-4" />
                </button>
              </div>
            }
          </div>
          @if (formData.mentorPlans.length < 3) {
            <button
              type="button"
              (click)="addPlan()"
              class="py-2.5 px-4 text-sm border border-border text-foreground rounded-md hover:bg-muted transition-colors"
            >
              + Add plan
            </button>
          }
        </div>

        <!-- Mentee Capacity -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">
            Maximum Mentee Capacity <span class="text-destructive">*</span>
          </label>
          <select
            [(ngModel)]="formData.menteeCapacity"
            [class.border-destructive]="errors['menteeCapacity']"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          >
            <option value="">Select capacity</option>
            <option value="1">1 mentee at a time</option>
            <option value="2-3">2-3 mentees at a time</option>
            <option value="4-5">4-5 mentees at a time</option>
            <option value="6-10">6-10 mentees at a time</option>
            <option value="10+">10+ mentees at a time</option>
          </select>
          @if (errors['menteeCapacity']) {
            <p class="text-sm text-destructive">{{ errors['menteeCapacity'] }}</p>
          }
        </div>

        <!-- Availability -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-foreground">
            Availability <span class="text-destructive">*</span>
          </label>
          <p class="text-sm text-muted-foreground">Select time slots when you're available</p>
          @if (errors['availability']) {
            <p class="text-sm text-destructive">{{ errors['availability'] }}</p>
          }
          <div class="grid md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-4 border border-border rounded-lg">
            @for (option of availabilityOptions; track option) {
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  [checked]="formData.availability.includes(option)"
                  (change)="toggleAvailability(option)"
                  class="rounded border-border text-primary focus:ring-ring"
                />
                <span class="text-sm text-foreground">{{ option }}</span>
              </label>
            }
          </div>
          <p class="text-xs text-muted-foreground">Selected: {{ formData.availability.length }} slot(s)</p>
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
export class PreferencePageComponent {
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);

  formData: PreferenceFormData = {
    mentorPlans: [],
    availability: [],
    menteeCapacity: '',
  };

  errors: Record<string, string> = {};

  readonly availabilityOptions = [
    'Saturday Morning', 'Saturday Afternoon', 'Saturday Evening',
    'Sunday Morning', 'Sunday Afternoon', 'Sunday Evening',
    'Monday Morning', 'Monday Afternoon', 'Monday Evening',
    'Tuesday Morning', 'Tuesday Afternoon', 'Tuesday Evening',
    'Wednesday Morning', 'Wednesday Afternoon', 'Wednesday Evening',
    'Thursday Morning', 'Thursday Afternoon', 'Thursday Evening',
    'Friday Morning', 'Friday Afternoon', 'Friday Evening',
  ];

  constructor() {
    this.store.select(selectRegistrationData).pipe(take(1)).subscribe((data) => {
      this.formData = {
        mentorPlans: data.mentorPlans.length > 0
          ? data.mentorPlans.map((p) => ({ ...p }))
          : [this.createPlan('monthly', data.subscriptionCost || 0)],
        availability: [...data.availability],
        menteeCapacity: data.menteeCapacity,
      };
    });
  }

  createPlan(duration: 'monthly' | 'quarterly' | '6months' = 'monthly', price: number = 0): MentorPlan {
    return {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      duration,
      price,
    };
  }

  addPlan(): void {
    if (this.formData.mentorPlans.length < 3) {
      this.formData.mentorPlans = [...this.formData.mentorPlans, this.createPlan()];
    }
  }

  async onRemovePlan(plan: MentorPlan): Promise<void> {
    if (this.formData.mentorPlans.length <= 1) return;
    const label = plan.duration === 'monthly' ? 'Monthly' : plan.duration === 'quarterly' ? 'Quarterly' : '6 months';
    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove Plan',
      message: `Are you sure you want to remove the ${label} plan?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      this.formData.mentorPlans = this.formData.mentorPlans.filter((p) => p.id !== plan.id);
    }
  }

  removePlan(id: string): void {
    if (this.formData.mentorPlans.length > 1) {
      this.formData.mentorPlans = this.formData.mentorPlans.filter((p) => p.id !== id);
    }
  }

  toggleAvailability(option: string): void {
    const next = this.formData.availability.includes(option)
      ? this.formData.availability.filter((a) => a !== option)
      : [...this.formData.availability, option];
    this.formData = { ...this.formData, availability: next };
  }

  validate(): boolean {
    this.errors = {};
    if (this.formData.mentorPlans.length === 0) {
      this.errors['mentorPlans'] = 'Add at least one pricing plan';
    } else if (this.formData.mentorPlans.some((p) => !p.price || p.price <= 0)) {
      this.errors['mentorPlans'] = 'Each plan must have a valid price';
    }
    if (this.formData.availability.length === 0) {
      this.errors['availability'] = 'Select at least one availability slot';
    }
    if (!this.formData.menteeCapacity) {
      this.errors['menteeCapacity'] = 'Select your mentee capacity';
    }
    return Object.keys(this.errors).length === 0;
  }

  onBack(): void {
    this.store.dispatch(updateData({ updates: this.formData }));
    this.store.dispatch(setCurrentStep({ step: 4 }));
    void this.router.navigate([ROUTES.registration.biography]);
  }

  onNext(): void {
    if (this.validate()) {
      const primaryPlan = this.formData.mentorPlans.find((p) => p.duration === 'monthly') ?? this.formData.mentorPlans[0];
      this.store.dispatch(updateData({
        updates: {
          ...this.formData,
          subscriptionCost: primaryPlan?.price ?? 0,
        }
      }));
      this.store.dispatch(setCurrentStep({ step: 6 }));
      void this.router.navigate([ROUTES.registration.preview]);
    }
  }
}
