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
import { DEFAULT_MENTEE_CAPACITY } from '../../../core/constants';
import type { MentorPlan, PayoutAccount } from '../../../core/models/registration.model';

interface PreferenceFormData {
  mentorPlans: MentorPlan[];
  availability: string[];
  menteeCapacity: string;
  payoutAccount: PayoutAccount | null;
}

/** Minimum prices per plan duration (USD). */
const MIN_PRICES: Record<string, number> = {
  monthly: 50,
  quarterly: 150,
  '6months': 600,
};

const DURATION_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  '6months': '6 months',
};

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
          <p class="text-sm text-muted-foreground">Add up to 3 subscription plans with your prices. Monthly plan is required.</p>
          @if (errors['mentorPlans']) {
            <p class="text-sm text-destructive">{{ errors['mentorPlans'] }}</p>
          }
          <div class="space-y-3">
            @for (plan of formData.mentorPlans; track plan.id; let i = $index) {
              <div class="space-y-1">
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
                        [class.border-destructive]="planErrors[plan.id]"
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
                @if (planErrors[plan.id]) {
                  <p class="text-xs text-destructive">{{ planErrors[plan.id] }}</p>
                }
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

        <!-- Mentee Capacity (read-only) -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">
            Maximum Mentee Capacity
          </label>
          <div class="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-foreground">
            {{ defaultCapacity }} mentees at a time
          </div>
          <p class="text-xs text-muted-foreground">Capacity is set by the platform administrator</p>
        </div>

        <!-- Payout Account -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-foreground">
            Payout Account <span class="text-destructive">*</span>
          </label>
          <p class="text-sm text-muted-foreground">Where your earnings will be deposited</p>
          @if (errors['payoutAccount']) {
            <p class="text-sm text-destructive">{{ errors['payoutAccount'] }}</p>
          }

          <!-- Account type radio buttons -->
          <div class="flex gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="payoutType"
                value="bank"
                [checked]="payoutType === 'bank'"
                (change)="onPayoutTypeChange('bank')"
                class="text-primary focus:ring-ring"
              />
              <span class="text-sm text-foreground">Bank Account</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="payoutType"
                value="instapay"
                [checked]="payoutType === 'instapay'"
                (change)="onPayoutTypeChange('instapay')"
                class="text-primary focus:ring-ring"
              />
              <span class="text-sm text-foreground">Instapay</span>
            </label>
          </div>

          @if (payoutType === 'bank') {
            <div class="space-y-3">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Bank Name <span class="text-destructive">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="payoutBankName"
                  placeholder="e.g. National Bank of Egypt"
                  [class.border-destructive]="errors['payoutBankName']"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                />
                @if (errors['payoutBankName']) {
                  <p class="text-xs text-destructive">{{ errors['payoutBankName'] }}</p>
                }
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Account Number <span class="text-destructive">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="payoutAccountNumber"
                  placeholder="Account number (10-20 digits)"
                  [class.border-destructive]="errors['payoutAccountNumber']"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                />
                @if (errors['payoutAccountNumber']) {
                  <p class="text-xs text-destructive">{{ errors['payoutAccountNumber'] }}</p>
                }
              </div>
            </div>
          } @else {
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Instapay Phone Number <span class="text-destructive">*</span></label>
              <input
                type="text"
                [(ngModel)]="payoutInstapayNumber"
                placeholder="01xxxxxxxxx"
                [class.border-destructive]="errors['payoutInstapayNumber']"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
              />
              @if (errors['payoutInstapayNumber']) {
                <p class="text-xs text-destructive">{{ errors['payoutInstapayNumber'] }}</p>
              }
            </div>
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

  readonly defaultCapacity = DEFAULT_MENTEE_CAPACITY;

  formData: PreferenceFormData = {
    mentorPlans: [],
    availability: [],
    menteeCapacity: '',
    payoutAccount: null,
  };

  errors: Record<string, string> = {};
  planErrors: Record<string, string> = {};

  // Payout fields
  payoutType: 'bank' | 'instapay' = 'bank';
  payoutBankName = '';
  payoutAccountNumber = '';
  payoutInstapayNumber = '';

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
          : [this.createPlan('monthly', data.subscriptionCost || '')],
        availability: [...data.availability],
        menteeCapacity: data.menteeCapacity || String(this.defaultCapacity),
        payoutAccount: data.payoutAccount ? { ...data.payoutAccount } : null,
      };
      // Restore payout fields from store
      if (data.payoutAccount) {
        this.payoutType = data.payoutAccount.type;
        this.payoutBankName = data.payoutAccount.bankName ?? '';
        this.payoutAccountNumber = data.payoutAccount.accountNumber ?? '';
        this.payoutInstapayNumber = data.payoutAccount.instapayNumber ?? '';
      }
    });
  }

  createPlan(duration: 'monthly' | 'quarterly' | '6months' = 'monthly', price = ''): MentorPlan {
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
    const label = DURATION_LABELS[plan.duration] ?? plan.duration;
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

  onPayoutTypeChange(type: 'bank' | 'instapay'): void {
    this.payoutType = type;
  }

  toggleAvailability(option: string): void {
    const next = this.formData.availability.includes(option)
      ? this.formData.availability.filter((a) => a !== option)
      : [...this.formData.availability, option];
    this.formData = { ...this.formData, availability: next };
  }

  private buildPayoutAccount(): PayoutAccount {
    if (this.payoutType === 'bank') {
      return { type: 'bank', bankName: this.payoutBankName.trim(), accountNumber: this.payoutAccountNumber.trim() };
    }
    return { type: 'instapay', instapayNumber: this.payoutInstapayNumber.trim() };
  }

  validate(): boolean {
    this.errors = {};
    this.planErrors = {};

    // Must have at least one plan
    if (this.formData.mentorPlans.length === 0) {
      this.errors['mentorPlans'] = 'Add at least one pricing plan';
    } else {
      // Must have a monthly plan
      const hasMonthly = this.formData.mentorPlans.some((p) => p.duration === 'monthly');
      if (!hasMonthly) {
        this.errors['mentorPlans'] = 'A monthly plan is required';
      }

      // Validate each plan price
      for (const plan of this.formData.mentorPlans) {
        const price = Number(plan.price);
        if (!plan.price || price <= 0) {
          this.planErrors[plan.id] = 'Price is required';
        } else {
          const minPrice = MIN_PRICES[plan.duration];
          if (minPrice && price < minPrice) {
            const label = DURATION_LABELS[plan.duration] ?? plan.duration;
            this.planErrors[plan.id] = `${label} plan minimum price is $${minPrice}`;
          }
        }
      }
      if (Object.keys(this.planErrors).length > 0 && !this.errors['mentorPlans']) {
        this.errors['mentorPlans'] = 'Please fix the pricing errors below';
      }
    }

    // Payout account validation
    if (this.payoutType === 'bank') {
      if (!this.payoutBankName.trim()) {
        this.errors['payoutBankName'] = 'Bank name is required';
      }
      const accNum = this.payoutAccountNumber.trim();
      if (!accNum) {
        this.errors['payoutAccountNumber'] = 'Account number is required';
      } else if (!/^\d{10,20}$/.test(accNum)) {
        this.errors['payoutAccountNumber'] = 'Account number must be 10-20 digits';
      }
    } else {
      const phone = this.payoutInstapayNumber.trim();
      if (!phone) {
        this.errors['payoutInstapayNumber'] = 'Instapay phone number is required';
      } else if (!/^01\d{9}$/.test(phone)) {
        this.errors['payoutInstapayNumber'] = 'Phone number must start with 01 and be 11 digits';
      }
    }
    if (this.errors['payoutBankName'] || this.errors['payoutAccountNumber'] || this.errors['payoutInstapayNumber']) {
      if (!this.errors['payoutAccount']) {
        this.errors['payoutAccount'] = 'Please complete your payout account details';
      }
    }

    if (this.formData.availability.length === 0) {
      this.errors['availability'] = 'Select at least one availability slot';
    }

    return Object.keys(this.errors).length === 0 && Object.keys(this.planErrors).length === 0;
  }

  onBack(): void {
    this.store.dispatch(updateData({
      updates: {
        ...this.formData,
        payoutAccount: this.buildPayoutAccount(),
      },
    }));
    this.store.dispatch(setCurrentStep({ step: 4 }));
    void this.router.navigate([ROUTES.registration.biography]);
  }

  onNext(): void {
    if (this.validate()) {
      const primaryPlan = this.formData.mentorPlans.find((p) => p.duration === 'monthly') ?? this.formData.mentorPlans[0];
      this.store.dispatch(updateData({
        updates: {
          ...this.formData,
          menteeCapacity: String(this.defaultCapacity),
          payoutAccount: this.buildPayoutAccount(),
          subscriptionCost: primaryPlan?.price ?? '',
        }
      }));
      this.store.dispatch(setCurrentStep({ step: 6 }));
      void this.router.navigate([ROUTES.registration.preview]);
    }
  }
}
