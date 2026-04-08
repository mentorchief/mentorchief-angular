import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { RegistrationFacade } from '../../../core/facades/registration.facade';
import { ROUTES } from '../../../core/routes';
import type { MentorPlan } from '../../../core/models/registration.model';
import { MENTEE_CAPACITY_MAX, parseMenteeCapacity } from '../../../core/constants';

@Component({
  selector: 'mc-preference-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="bg-card border border-primary/20 rounded-lg overflow-hidden">
      <div class="p-6 border-b border-border">
        <h2 class="text-lg text-foreground">Mentorship Preferences</h2>
        <p class="text-sm text-muted-foreground mt-1">Configure your pricing plans and mentee capacity</p>
      </div>
      <div class="p-6 space-y-6">
        <div class="space-y-3">
          <label class="block text-sm font-medium text-foreground">Pricing Plans <span class="text-destructive">*</span></label>
          <p class="text-sm text-muted-foreground">Add up to 3 subscription plans with your prices.</p>
          @if (errors['mentorPlans']) { <p class="text-sm text-destructive">{{ errors['mentorPlans'] }}</p> }
          <div class="space-y-3">
            @for (plan of plans; track plan.id; let i = $index) {
              <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div class="w-full sm:w-40">
                  <label class="text-xs text-muted-foreground">Plan {{ i + 1 }} duration</label>
                  <select [(ngModel)]="plan.duration" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors">
                    <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="6months">6 months</option>
                  </select>
                </div>
                <div class="flex-1 w-full">
                  <label class="text-xs text-muted-foreground">Price (USD)</label>
                  <div class="relative"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span><input type="number" min="1" [(ngModel)]="plan.price" placeholder="299" class="w-full pl-8 pr-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" /></div>
                </div>
                <button type="button" (click)="onRemovePlan(plan)" [disabled]="plans.length === 1" class="p-2.5 border border-border rounded-md hover:bg-muted disabled:opacity-50 transition-colors"><fa-icon [icon]="['fas', 'xmark']" class="w-4 h-4" /></button>
              </div>
            }
          </div>
          @if (plans.length < 3) { <button type="button" (click)="addPlan()" class="py-2.5 px-4 text-sm border border-border text-foreground rounded-md hover:bg-muted transition-colors">+ Add plan</button> }
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">Maximum Mentee Capacity <span class="text-destructive">*</span></label>
          <p class="text-xs text-muted-foreground">How many mentees you can work with at once (whole number, at least 1).</p>
          <input
            type="number"
            min="1"
            [max]="menteeCapacityMax"
            step="1"
            [(ngModel)]="menteeCapacityNum"
            [class.border-destructive]="errors['menteeCapacity']"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
          @if (errors['menteeCapacity']) { <p class="text-sm text-destructive">{{ errors['menteeCapacity'] }}</p> }
        </div>
        <div class="flex justify-between pt-4">
          <button type="button" (click)="onBack()" class="py-2.5 px-5 border border-border text-foreground rounded-md hover:bg-muted transition-colors">Back</button>
          <button type="button" (click)="onNext()" class="py-2.5 px-5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">Next</button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencePageComponent {
  private readonly reg = inject(RegistrationFacade);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);

  plans: MentorPlan[] = this.reg.data.mentorPlans.length > 0
    ? this.reg.data.mentorPlans.map((p) => ({ ...p }))
    : [this.createPlan('monthly', this.reg.data.subscriptionCost || '')];
  readonly menteeCapacityMax = MENTEE_CAPACITY_MAX;
  menteeCapacityNum: number | null = parseMenteeCapacity(this.reg.data.menteeCapacity);
  errors: Record<string, string> = {};

  createPlan(duration: 'monthly' | 'quarterly' | '6months' = 'monthly', price = ''): MentorPlan {
    return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, duration, price };
  }

  addPlan(): void {
    if (this.plans.length < 3) this.plans = [...this.plans, this.createPlan()];
  }

  async onRemovePlan(plan: MentorPlan): Promise<void> {
    if (this.plans.length <= 1) return;
    const label = plan.duration === 'monthly' ? 'Monthly' : plan.duration === 'quarterly' ? 'Quarterly' : '6 months';
    const confirmed = await this.confirmDialog.confirm({ title: 'Remove Plan', message: `Remove the ${label} plan?`, confirmLabel: 'Remove', cancelLabel: 'Cancel', variant: 'danger' });
    if (confirmed) this.plans = this.plans.filter((p) => p.id !== plan.id);
  }

  validate(): boolean {
    this.errors = {};
    if (this.plans.length === 0) this.errors['mentorPlans'] = 'Add at least one pricing plan';
    else if (this.plans.some((p) => !p.price || Number(p.price) <= 0)) this.errors['mentorPlans'] = 'Each plan must have a valid price';
    const capErr = this.validateMenteeCapacityField();
    if (capErr) this.errors['menteeCapacity'] = capErr;
    return Object.keys(this.errors).length === 0;
  }

  private validateMenteeCapacityField(): string | null {
    const raw = this.menteeCapacityNum;
    if (raw === null || raw === undefined || (typeof raw === 'number' && !Number.isFinite(raw))) {
      return 'Enter a whole number of mentees (at least 1).';
    }
    const n = Number(raw);
    if (!Number.isInteger(n)) return 'Use a whole number (no decimals).';
    if (n < 1) return 'Capacity must be at least 1 (zero and negative numbers are not allowed).';
    if (n > MENTEE_CAPACITY_MAX) return `Capacity cannot exceed ${MENTEE_CAPACITY_MAX}.`;
    return null;
  }

  private menteeCapacityString(): string {
    return String(Math.trunc(Number(this.menteeCapacityNum)));
  }

  onBack(): void {
    const capErr = this.validateMenteeCapacityField();
    const menteeCapacity = capErr
      ? this.reg.data.menteeCapacity || String(parseMenteeCapacity(undefined))
      : this.menteeCapacityString();
    this.reg.update({ mentorPlans: this.plans, menteeCapacity });
    this.reg.setStep(4);
    void this.router.navigate([ROUTES.registration.biography]);
  }

  onNext(): void {
    if (this.validate()) {
      const primary = this.plans.find((p) => p.duration === 'monthly') ?? this.plans[0];
      this.reg.update({
        mentorPlans: this.plans,
        menteeCapacity: this.menteeCapacityString(),
        subscriptionCost: primary?.price ?? '',
      });
      this.reg.setStep(6);
      void this.router.navigate([ROUTES.registration.preview]);
    }
  }
}
