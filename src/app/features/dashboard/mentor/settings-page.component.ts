import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { Observable, combineLatest, map, take, filter } from 'rxjs';
import {
  DEFAULT_SAMPLE_PRICE,
  DEFAULT_MENTEE_CAPACITY,
  MENTEE_CAPACITY_MAX,
  parseMenteeCapacity,
} from '../../../core/constants';
import type { User, MentorPlan, UserExperience } from '../../../core/models/user.model';
import { MentorFacade } from '../../../core/facades/mentor.facade';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { displayNameParts } from '../../../core/utils/user-display.utils';

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

function menteeCapacityFormValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') return { required: true };
    const n = Number(raw);
    if (!Number.isFinite(n)) return { invalidCapacity: true };
    if (!Number.isInteger(n)) return { notInteger: true };
    if (n < 1) return { minCapacity: true };
    if (n > MENTEE_CAPACITY_MAX) return { maxCapacity: true };
    return null;
  };
}

@Component({
  selector: 'mc-mentor-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FontAwesomeModule],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">Settings</h1>
        <p class="text-muted-foreground mt-1">Manage your mentor profile and preferences</p>
      </div>

      @if (user$ | async; as user) {
        <p class="text-sm text-muted-foreground mb-6 pb-4 border-b border-border">
          Edit the same data you entered during registration. Each section has its own save — personal, career, biography, mentorship preferences, plus payout and availability below.
        </p>

        <!-- Personal information -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-1">Personal information</h2>
          <p class="text-sm text-muted-foreground mb-4">First name, last name, phone, country, gender, and photo — same as registration.</p>
          <div class="flex items-start gap-6">
            <div class="shrink-0 space-y-3">
              <div class="w-20 h-20 bg-primary rounded-lg overflow-hidden flex items-center justify-center">
                @if (profileForm.get('avatar')?.value) {
                  <img [src]="profileForm.get('avatar')?.value" alt="Profile photo" class="w-full h-full object-cover" />
                } @else {
                  <span class="text-primary-foreground text-2xl font-semibold">{{ displayInitials() }}</span>
                }
              </div>
              <input type="file" accept="image/*" class="hidden" #mentorAvatarInput (change)="onAvatarSelected($event)" aria-hidden="true" />
              <button type="button" class="w-48 px-3 py-2 text-xs bg-input-background border border-border rounded-md hover:bg-muted" (click)="mentorAvatarInput.click()" aria-label="Upload profile photo">Upload photo</button>
            </div>
            <div class="flex-1 space-y-4">
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">First name <span class="text-destructive">*</span></label>
                  <input type="text" [ngModel]="profileForm.get('firstName')?.value" (ngModelChange)="profileForm.patchValue({ firstName: $event })" name="mentorFirstName" [class.border-destructive]="errors['firstName']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
                  @if (errors['firstName']) { <p class="text-xs text-destructive mt-1">{{ errors['firstName'] }}</p> }
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">Last name <span class="text-destructive">*</span></label>
                  <input type="text" [ngModel]="profileForm.get('lastName')?.value" (ngModelChange)="profileForm.patchValue({ lastName: $event })" name="mentorLastName" [class.border-destructive]="errors['lastName']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
                  @if (errors['lastName']) { <p class="text-xs text-destructive mt-1">{{ errors['lastName'] }}</p> }
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input type="email" [value]="user.email" disabled class="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-muted-foreground" />
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">Phone number <span class="text-destructive">*</span></label>
                  <input type="text" [ngModel]="profileForm.get('phone')?.value" (ngModelChange)="profileForm.patchValue({ phone: $event })" name="profilePhone" placeholder="+1 (555) 000-0000" [class.border-destructive]="errors['phone']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
                  @if (errors['phone']) { <p class="text-xs text-destructive mt-1">{{ errors['phone'] }}</p> }
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">Country <span class="text-destructive">*</span></label>
                  <select [ngModel]="profileForm.get('location')?.value" (ngModelChange)="profileForm.patchValue({ location: $event })" name="profileLocation" [class.border-destructive]="errors['location']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md">
                    <option value="">Select country</option>
                    @for (country of countries; track country) { <option [value]="country">{{ country }}</option> }
                  </select>
                  @if (errors['location']) { <p class="text-xs text-destructive mt-1">{{ errors['location'] }}</p> }
                </div>
              </div>
              <div class="max-w-md">
                <label class="block text-sm font-medium text-foreground mb-1.5">Gender <span class="text-destructive">*</span></label>
                <select [ngModel]="profileForm.get('gender')?.value" (ngModelChange)="profileForm.patchValue({ gender: $event })" name="profileGender" [class.border-destructive]="errors['gender']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
                @if (errors['gender']) { <p class="text-xs text-destructive mt-1">{{ errors['gender'] }}</p> }
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end border-t border-border pt-6">
            <button type="button" (click)="onSavePersonalInformation()" class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">Save personal information</button>
          </div>
        </div>

        <!-- Career information + work history -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-1">Career information</h2>
          <p class="text-sm text-muted-foreground mb-4">Current role, total years of experience, and optional work history (same as registration).</p>
          <div class="space-y-4 max-w-3xl">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Current job title <span class="text-destructive">*</span></label>
              <input type="text" [ngModel]="profileForm.get('jobTitle')?.value" (ngModelChange)="profileForm.patchValue({ jobTitle: $event })" name="profileJobTitle" [class.border-destructive]="errors['jobTitle']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" placeholder="e.g., Senior Software Engineer" />
              @if (errors['jobTitle']) { <p class="text-xs text-destructive mt-1">{{ errors['jobTitle'] }}</p> }
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Current company <span class="text-destructive">*</span></label>
              <input type="text" [ngModel]="profileForm.get('company')?.value" (ngModelChange)="profileForm.patchValue({ company: $event })" name="profileCompany" placeholder="Company or organization" [class.border-destructive]="errors['company']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              @if (errors['company']) { <p class="text-xs text-destructive mt-1">{{ errors['company'] }}</p> }
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Years of experience <span class="text-destructive">*</span></label>
              <input type="number" min="0" step="1" [ngModel]="profileForm.get('yearsOfExperience')?.value" (ngModelChange)="onYearsOfExperienceInput($event)" name="profileYearsOfExperience" placeholder="e.g., 8" [class.border-destructive]="errors['yearsOfExperience']" class="w-full max-w-xs px-4 py-2.5 bg-input-background border border-border rounded-md" />
              <p class="text-xs text-muted-foreground mt-1.5">Total years of professional experience.</p>
              @if (errors['yearsOfExperience']) { <p class="text-xs text-destructive mt-1">{{ errors['yearsOfExperience'] }}</p> }
            </div>
            <div class="border-t border-border pt-6 space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 class="text-sm font-medium text-foreground">Work history</h3>
                  <p class="text-xs text-muted-foreground mt-0.5">Optional — add past or additional roles.</p>
                </div>
                <button type="button" (click)="addExperience()" class="py-2 px-4 text-sm border border-border text-foreground rounded-md hover:bg-muted shrink-0">+ Add role</button>
              </div>
              @if (errors['experiences']) { <p class="text-xs text-destructive">{{ errors['experiences'] }}</p> }
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
                      <input type="text" [(ngModel)]="exp.title" class="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-md text-sm" placeholder="Job title" />
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground">Company</label>
                      <input type="text" [(ngModel)]="exp.company" class="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-md text-sm" placeholder="Company" />
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
                    <input type="checkbox" [ngModel]="exp.current" (ngModelChange)="onExperienceCurrentChange(exp, $event)" class="rounded border-border text-primary" />
                    I currently work here
                  </label>
                  <div>
                    <label class="text-xs text-muted-foreground">Description</label>
                    <textarea [(ngModel)]="exp.description" rows="2" class="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-md text-sm" placeholder="What you did (optional)"></textarea>
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="mt-6 flex justify-end border-t border-border pt-6">
            <button type="button" (click)="onSaveCareerInformation()" class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">Save career &amp; work history</button>
          </div>
        </div>

        <!-- Biography & expertise (chip UX like registration) -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-1">Biography &amp; expertise</h2>
          <p class="text-sm text-muted-foreground mb-4">Biography, skills (Enter to add), tools, and LinkedIn profile URL — same as registration.</p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Professional biography <span class="text-destructive">*</span></label>
              <textarea rows="6" [ngModel]="profileForm.get('bio')?.value" (ngModelChange)="profileForm.patchValue({ bio: $event })" name="profileBio" placeholder="Tell mentees about your professional journey..." [class.border-destructive]="errors['bio']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md"></textarea>
              <p class="text-xs text-muted-foreground mt-1">{{ (profileForm.get('bio')?.value || '').length }} / 500 (min 50)</p>
              @if (errors['bio']) { <p class="text-xs text-destructive mt-1">{{ errors['bio'] }}</p> }
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-foreground">Skills <span class="text-destructive">*</span></label>
              <p class="text-xs text-muted-foreground">Type a skill and press Enter to add (same as registration).</p>
              <input type="text" [(ngModel)]="skillInput" (keydown.enter)="addSkill($event)" [class.border-destructive]="errors['skills']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" placeholder="e.g. Product strategy" />
              @if (errors['skills']) { <p class="text-xs text-destructive mt-1">{{ errors['skills'] }}</p> }
              @if (skills.length > 0) {
                <div class="flex flex-wrap gap-2 mt-2">
                  @for (skill of skills; track skill) {
                    <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm">{{ skill }}<button type="button" (click)="removeSkill(skill)" class="hover:text-primary" aria-label="Remove skill"><fa-icon [icon]="['fas', 'xmark']" class="w-3.5 h-3.5" /></button></span>
                  }
                </div>
              }
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-foreground">Tools &amp; technologies</label>
              <input type="text" [(ngModel)]="toolInput" (keydown.enter)="addTool($event)" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" placeholder="Type a tool and press Enter" />
              @if (tools.length > 0) {
                <div class="flex flex-wrap gap-2 mt-2">
                  @for (tool of tools; track tool) {
                    <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground rounded-md text-sm">{{ tool }}<button type="button" (click)="removeTool(tool)" class="hover:text-foreground" aria-label="Remove tool"><fa-icon [icon]="['fas', 'xmark']" class="w-3.5 h-3.5" /></button></span>
                  }
                </div>
              }
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">LinkedIn profile <span class="text-muted-foreground font-normal">(optional)</span></label>
              <p class="text-xs text-muted-foreground mb-1.5">
                Shown on your public mentor profile. Use your full LinkedIn profile URL.
              </p>
              <input
                type="url"
                [ngModel]="profileForm.get('linkedin')?.value"
                (ngModelChange)="profileForm.patchValue({ linkedin: $event })"
                name="mentorLinkedin"
                placeholder="https://www.linkedin.com/in/your-profile"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md"
              />
            </div>
          </div>
          <div class="mt-6 flex justify-end border-t border-border pt-6">
            <button type="button" (click)="onSaveBiographyExpertise()" class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">Save biography &amp; expertise</button>
          </div>
        </div>

        <!-- Mentorship preferences (registration parity) -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-1">Mentorship preferences</h2>
          <p class="text-sm text-muted-foreground mb-4">Pricing plans and mentee capacity — same as the preferences step during registration.</p>
          <div class="space-y-6">
            <!-- Pricing Plans -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Pricing Plans</label>
              <p class="text-muted-foreground text-xs mb-3">Add up to 3 subscription plans with your prices.</p>
              @if (errors['mentorPlans']) { <p class="text-xs text-destructive mb-2">{{ errors['mentorPlans'] }}</p> }
              <div class="space-y-3">
                @for (plan of mentorPlans; track plan.id; let i = $index) {
                  <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div class="w-full sm:w-40">
                      <label class="text-xs text-muted-foreground">Plan {{ i + 1 }} duration</label>
                      <select [(ngModel)]="plan.duration" [name]="'planDuration' + i" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md">
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="6months">6 months</option>
                      </select>
                    </div>
                    <div class="flex-1 w-full">
                      <label class="text-xs text-muted-foreground">Price (USD)</label>
                      <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <input type="number" min="1" [(ngModel)]="plan.price" [name]="'planPrice' + i" placeholder="299" class="w-full pl-8 pr-4 py-2.5 bg-input-background border border-border rounded-md" />
                      </div>
                    </div>
                    <button type="button" (click)="removePlan(plan)" [disabled]="mentorPlans.length === 1" class="p-2.5 border border-border rounded-md hover:bg-muted disabled:opacity-50">
                      <fa-icon [icon]="['fas', 'xmark']" class="w-4 h-4" />
                    </button>
                  </div>
                }
              </div>
              @if (mentorPlans.length < 3) {
                <button type="button" (click)="addPlan()" class="mt-3 py-2 px-4 text-sm border border-border text-foreground rounded-md hover:bg-muted">+ Add plan</button>
              }
            </div>
            <!-- Capacity -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Mentee Capacity</label>
              <p class="text-xs text-muted-foreground mb-1.5">Maximum mentees at once (whole number, at least 1).</p>
              <input
                type="number"
                [ngModel]="profileForm.get('menteeCapacity')?.value"
                (ngModelChange)="onMenteeCapacityInput($event)"
                [ngModelOptions]="{ standalone: true }"
                name="mentorMenteeCapacity"
                min="1"
                [max]="menteeCapacityMax"
                step="1"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md"
                [class.border-destructive]="profileForm.get('menteeCapacity')?.invalid && profileForm.get('menteeCapacity')?.touched"
              />
              @if (profileForm.get('menteeCapacity')?.invalid && profileForm.get('menteeCapacity')?.touched) {
                <p class="text-sm text-destructive mt-1">{{ menteeCapacityErrorMessage() }}</p>
              }
            </div>
          </div>
          <div class="mt-6 flex justify-end border-t border-border pt-6">
            <button type="button" (click)="onSaveMentorshipSettings()" class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Save mentorship preferences
            </button>
          </div>
        </div>

        <!-- Payout Account -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-4">Payout Account</h2>
          <p class="text-muted-foreground text-sm mb-4">Where your earnings will be deposited. Update your bank account or Instapay details below.</p>
          <div class="flex items-center gap-4 p-4 bg-muted/50 rounded-lg mb-4">
            @if ((payoutAccount$ | async); as payoutAccount) {
            @if (payoutAccount.type === 'bank') {
              <div class="w-12 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
                <span class="text-white text-xs font-bold">BANK</span>
              </div>
              <div class="flex-1">
                <p class="text-foreground text-sm font-medium">{{ payoutAccount.bankName }} •••• {{ payoutAccount.accountNumber?.slice(-4) ?? '----' }}</p>
              </div>
            } @else {
              <div class="w-12 h-8 bg-indigo-600 rounded flex items-center justify-center shrink-0">
                <span class="text-white text-xs font-bold">INSTAPAY</span>
              </div>
              <div class="flex-1">
                <p class="text-foreground text-sm font-medium">•••• {{ payoutAccount.instapayNumber?.slice(-4) ?? '----' }}</p>
                <p class="text-muted-foreground text-xs">Instapay</p>
              </div>
            }
            }
          </div>
          <button type="button" (click)="openPayoutDialog()" class="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-muted">
            Update Payout Account
          </button>
        </div>

        <!-- Accepting mentees & capacity summary -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-4">Mentee requests</h2>
          <div class="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-4">
            <div>
              <p class="text-foreground font-medium">Accepting New Mentees</p>
              <p class="text-muted-foreground text-sm">Toggle off to pause new requests</p>
            </div>
            <button
              type="button"
              [class]="(acceptingNewMentees$ | async) ? 'bg-primary' : 'bg-muted'"
              class="relative w-11 h-6 rounded-full transition-colors inline-flex items-center"
              (click)="toggleAccepting()"
            >
              <span
                [class]="(acceptingNewMentees$ | async) ? 'translate-x-6' : 'translate-x-0.5'"
                class="absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform"
              ></span>
            </button>
          </div>
          <p class="text-muted-foreground text-sm mb-4">
            You have {{ ((spotsAvailable$ | async) ?? 0) }} spots available out of {{ (mentorCapacity$ | async) ?? defaultCapacity }} total capacity.
          </p>
        </div>
      }
    </div>

    <!-- Payout Account Dialog -->
    @if (payoutDialogOpen) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payout-dialog-title"
      >
        <div class="absolute inset-0 bg-foreground/50 backdrop-blur-sm" (click)="closePayoutDialog()"></div>
        <div class="relative bg-card rounded-lg shadow-xl border border-border max-w-md w-full p-6" (click)="$event.stopPropagation()">
          <h2 id="payout-dialog-title" class="text-lg font-medium text-foreground mb-4">Update Payout Account</h2>
          <form [formGroup]="payoutForm" (ngSubmit)="onSavePayout()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Account Type <span class="text-destructive">*</span></label>
              <select formControlName="type" (change)="onPayoutTypeChange()" class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm">
                <option value="bank">Bank Account</option>
                <option value="instapay">Instapay</option>
              </select>
            </div>
            @if (payoutForm.get('type')?.value === 'bank') {
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Bank Name <span class="text-destructive">*</span></label>
                <input formControlName="bankName" type="text" placeholder="e.g. Chase Bank" class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm" />
                @if (payoutForm.get('bankName')?.invalid && payoutForm.get('bankName')?.touched) {
                  <p class="text-destructive text-xs mt-1">Bank name is required</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Account Number <span class="text-destructive">*</span></label>
                <input formControlName="accountNumber" type="text" placeholder="Account number" class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm" />
                @if (payoutForm.get('accountNumber')?.invalid && payoutForm.get('accountNumber')?.touched) {
                  <p class="text-destructive text-xs mt-1">Account number is required (min 8 characters)</p>
                }
              </div>
            } @else {
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Instapay Number <span class="text-destructive">*</span></label>
                <input formControlName="instapayNumber" type="text" placeholder="Phone number or Instapay ID" class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm" />
                @if (payoutForm.get('instapayNumber')?.invalid && payoutForm.get('instapayNumber')?.touched) {
                  <p class="text-destructive text-xs mt-1">Instapay number is required (min 10 characters)</p>
                }
              </div>
            }
            <div class="flex justify-end gap-3 pt-4">
              <button type="button" (click)="closePayoutDialog()" class="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted">
                Cancel
              </button>
              <button type="submit" [disabled]="payoutForm.invalid" class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorSettingsPageComponent implements OnInit {
  private readonly mentorData = inject(MentorFacade);
  private readonly auth = inject(AuthFacade);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  readonly user$: Observable<User | null> = this.auth.currentUser$;
  readonly payoutAccount$ = this.mentorData.data$.pipe(map((d) => d.payoutAccount));
  readonly acceptingNewMentees$ = this.mentorData.data$.pipe(map((d) => d.acceptingNewMentees));
  readonly defaultSamplePrice = DEFAULT_SAMPLE_PRICE;
  readonly defaultCapacity = DEFAULT_MENTEE_CAPACITY;
  readonly menteeCapacityMax = MENTEE_CAPACITY_MAX;
  readonly mentorCapacity$ = this.auth.currentUser$.pipe(map((u) => parseMenteeCapacity(u?.menteeCapacity)));
  readonly spotsAvailable$ = combineLatest([
    this.mentorCapacity$,
    this.mentorData.data$.pipe(map((d) => d.myMentees.filter((m) => m.status === 'active'))),
  ]).pipe(map(([cap, active]) => Math.max(0, cap - active.length)));

  readonly countries = ['United States','United Kingdom','Canada','Australia','Germany','France','India','Japan','Brazil','Netherlands','Singapore','Sweden','Switzerland','Spain','Italy','South Korea','China','Mexico','Indonesia','Poland','Turkey','Nigeria','Egypt','South Africa','Kenya','Argentina','Chile','Colombia','Other'];

  payoutDialogOpen = false;
  profileForm: FormGroup = this.fb.group({
    avatar: [''],
    firstName: [''],
    lastName: [''],
    phone: [''],
    location: [''],
    gender: [''],
    jobTitle: [''],
    company: [''],
    yearsOfExperience: [''],
    bio: [''],
    linkedin: [''],
    menteeCapacity: [DEFAULT_MENTEE_CAPACITY, [menteeCapacityFormValidator()]],
  });
  payoutForm: FormGroup = this.fb.group({
    type: ['bank' as const, Validators.required],
    bankName: ['', Validators.required],
    accountNumber: ['', [Validators.required, Validators.minLength(8)]],
    instapayNumber: ['', [Validators.required, Validators.minLength(10)]],
  });
  skills: string[] = [];
  tools: string[] = [];
  skillInput = '';
  toolInput = '';
  experiences: UserExperience[] = [];
  mentorPlans: MentorPlan[] = [];
  errors: Record<string, string> = {};

  ngOnInit(): void {
    this.user$.pipe(filter((u): u is User => u != null), take(1)).subscribe((user) => {
      const { firstName, lastName } = displayNameParts(user);
      this.profileForm.patchValue({
        avatar: user.avatar ?? '',
        firstName,
        lastName,
        phone: user.phone ?? '',
        location: user.location ?? '',
        gender: user.gender ?? '',
        jobTitle: user.jobTitle ?? '',
        company: user.company ?? '',
        yearsOfExperience: user.yearsOfExperience ?? '',
        bio: user.bio ?? '',
        linkedin: user.linkedin ?? user.portfolioUrl ?? '',
        menteeCapacity: parseMenteeCapacity(user.menteeCapacity),
      });
      this.skills = [...(user.skills ?? [])];
      this.tools = [...(user.tools ?? [])];
      this.experiences = (user.experiences ?? []).length > 0 ? user.experiences!.map((e) => ({ ...e })) : [];
      this.mentorPlans = (user.mentorPlans ?? []).length > 0
        ? user.mentorPlans!.map((p) => ({ ...p }))
        : [this.createPlan('monthly', user.subscriptionCost ?? String(this.defaultSamplePrice))];
      this.cdr.markForCheck();
    });
  }

  displayInitials(): string {
    const f = String(this.profileForm.get('firstName')?.value ?? '').trim();
    const l = String(this.profileForm.get('lastName')?.value ?? '').trim();
    const a = (f[0] ?? '') + (l[0] ?? '');
    return a ? a.toUpperCase() : 'M';
  }

  toggleAccepting(): void {
    this.mentorData.setAcceptingNewMentees(!this.mentorData.data.acceptingNewMentees);
    this.cdr.markForCheck();
  }

  onYearsOfExperienceInput(value: number | string | null): void {
    const raw =
      value === null || value === undefined || value === ''
        ? ''
        : typeof value === 'number'
          ? String(value)
          : String(value).trim();
    this.profileForm.patchValue({ yearsOfExperience: raw });
    this.cdr.markForCheck();
  }

  onMenteeCapacityInput(value: number | string | null): void {
    const ctrl = this.profileForm.get('menteeCapacity');
    if (!ctrl) return;
    if (value === '' || value === null || value === undefined) {
      ctrl.setValue(null);
    } else {
      ctrl.setValue(typeof value === 'number' ? value : Number(value));
    }
    ctrl.markAsTouched();
    ctrl.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  menteeCapacityErrorMessage(): string {
    const c = this.profileForm.get('menteeCapacity');
    if (!c?.errors) return '';
    if (c.errors['required']) return 'Enter a whole number of mentees (at least 1).';
    if (c.errors['notInteger']) return 'Use a whole number (no decimals).';
    if (c.errors['minCapacity']) return 'Capacity must be at least 1 (zero and negative numbers are not allowed).';
    if (c.errors['maxCapacity']) return `Capacity cannot exceed ${MENTEE_CAPACITY_MAX}.`;
    return 'Enter a valid mentee capacity.';
  }

  addSkill(event: Event): void {
    event.preventDefault();
    const v = this.skillInput.trim();
    if (v && !this.skills.some((s) => s.toLowerCase() === v.toLowerCase())) this.skills = [...this.skills, v];
    this.skillInput = '';
    this.cdr.markForCheck();
  }

  removeSkill(skill: string): void {
    this.skills = this.skills.filter((s) => s !== skill);
    this.cdr.markForCheck();
  }

  addTool(event: Event): void {
    event.preventDefault();
    const v = this.toolInput.trim();
    if (v && !this.tools.some((t) => t.toLowerCase() === v.toLowerCase())) this.tools = [...this.tools, v];
    this.toolInput = '';
    this.cdr.markForCheck();
  }

  removeTool(tool: string): void {
    this.tools = this.tools.filter((t) => t !== tool);
    this.cdr.markForCheck();
  }

  addExperience(): void {
    this.experiences = [...this.experiences, createEmptyExperience()];
    this.cdr.markForCheck();
  }

  removeExperience(exp: UserExperience): void {
    this.experiences = this.experiences.filter((e) => e.id !== exp.id);
    this.cdr.markForCheck();
  }

  onExperienceCurrentChange(exp: UserExperience, current: boolean): void {
    exp.current = current;
    if (current) exp.endDate = '';
    this.cdr.markForCheck();
  }

  private sanitizedExperiences(): UserExperience[] {
    return this.experiences.filter((e) =>
      [e.title, e.company, e.startDate, e.endDate, e.description].some((x) => String(x ?? '').trim()) || e.current,
    );
  }

  private validateWorkHistoryRows(): boolean {
    const rows = this.sanitizedExperiences();
    for (const e of rows) {
      if (!e.title.trim() || !e.company.trim()) {
        this.errors['experiences'] = 'Each work history entry needs a job title and company (or remove incomplete rows).';
        return false;
      }
    }
    return true;
  }

  onSaveMentorshipSettings(): void {
    this.errors = {};
    this.profileForm.get('menteeCapacity')?.markAsTouched();
    if (!this.validateMentorshipBlock()) {
      this.toast.error('Please fix mentorship preferences before saving.');
      this.cdr.markForCheck();
      return;
    }
    const v = this.profileForm.getRawValue();
    const primaryPlan = this.mentorPlans.find((p) => p.duration === 'monthly') ?? this.mentorPlans[0];
    this.auth.updateProfile({
      menteeCapacity: String(Math.trunc(Number(v.menteeCapacity))),
      mentorPlans: this.mentorPlans.map((p) => ({ ...p })),
      subscriptionCost: primaryPlan?.price ?? undefined,
    });
    this.toast.success('Mentorship preferences saved.');
    this.cdr.markForCheck();
  }

  onSavePersonalInformation(): void {
    this.errors = {};
    if (!this.validatePersonalInformation()) {
      this.toast.error('Please complete all required personal fields.');
      this.cdr.markForCheck();
      return;
    }
    const v = this.profileForm.getRawValue();
    const first = String(v.firstName ?? '').trim();
    const last = String(v.lastName ?? '').trim();
    const name = `${first} ${last}`.trim();
    this.auth.updateProfile({
      firstName: first,
      lastName: last,
      name,
      avatar: v.avatar || undefined,
      phone: v.phone || undefined,
      location: v.location || undefined,
      gender: v.gender || undefined,
    });
    this.toast.success('Personal information saved.');
    this.cdr.markForCheck();
  }

  onSaveCareerInformation(): void {
    this.errors = {};
    if (!this.validateCareerInformation()) {
      this.toast.error('Please complete career fields and work history.');
      this.cdr.markForCheck();
      return;
    }
    const v = this.profileForm.getRawValue();
    const cleaned = this.sanitizedExperiences().map((e) => ({ ...e }));
    this.auth.updateProfile({
      jobTitle: String(v.jobTitle ?? '').trim() || undefined,
      company: String(v.company ?? '').trim() || undefined,
      yearsOfExperience: String(v.yearsOfExperience ?? '').trim() || undefined,
      experiences: cleaned.length ? cleaned : [],
    });
    this.toast.success('Career and work history saved.');
    this.cdr.markForCheck();
  }

  onSaveBiographyExpertise(): void {
    this.errors = {};
    if (!this.validateBiographyExpertise()) {
      this.toast.error('Please complete biography and at least one skill.');
      this.cdr.markForCheck();
      return;
    }
    const v = this.profileForm.getRawValue();
    const linkedin = String(v.linkedin ?? '').trim();
    this.auth.updateProfile({
      bio: String(v.bio ?? '').trim() || undefined,
      linkedin: linkedin || undefined,
      portfolioUrl: undefined,
      skills: [...this.skills],
      tools: [...this.tools],
    });
    this.toast.success('Biography and expertise saved.');
    this.cdr.markForCheck();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Please select a valid image file.');
      if (input) input.value = '';
      return;
    }
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.toast.error('Image size must be 2MB or less.');
      if (input) input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.profileForm.patchValue({ avatar: String(reader.result ?? '') });
      this.toast.success('Photo loaded — save personal information to keep it.');
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
    if (input) input.value = '';
  }

  createPlan(duration: 'monthly' | 'quarterly' | '6months' = 'monthly', price = ''): MentorPlan {
    return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, duration, price };
  }

  addPlan(): void {
    if (this.mentorPlans.length < 3) {
      this.mentorPlans = [...this.mentorPlans, this.createPlan()];
      this.cdr.markForCheck();
    }
  }

  async removePlan(plan: MentorPlan): Promise<void> {
    if (this.mentorPlans.length <= 1) return;
    const label = plan.duration === 'monthly' ? 'Monthly' : plan.duration === 'quarterly' ? 'Quarterly' : '6 months';
    const confirmed = await this.confirmDialog.confirm({ title: 'Remove Plan', message: `Remove the ${label} plan?`, confirmLabel: 'Remove', cancelLabel: 'Cancel', variant: 'danger' });
    if (confirmed) {
      this.mentorPlans = this.mentorPlans.filter((p) => p.id !== plan.id);
      this.cdr.markForCheck();
    }
  }

  /** Plans and capacity — same rules as registration preferences. */
  private validateMentorshipBlock(): boolean {
    let ok = true;
    if (this.mentorPlans.length === 0) {
      this.errors['mentorPlans'] = 'Add at least one pricing plan';
      ok = false;
    } else if (this.mentorPlans.some((p) => !p.price || Number(p.price) <= 0)) {
      this.errors['mentorPlans'] = 'Each plan must have a valid price';
      ok = false;
    }
    const capCtrl = this.profileForm.get('menteeCapacity');
    if (capCtrl?.invalid) {
      this.errors['menteeCapacity'] = this.menteeCapacityErrorMessage();
      ok = false;
    }
    return ok;
  }

  private validatePersonalInformation(): boolean {
    const v = this.profileForm.getRawValue();
    if (!String(v.firstName ?? '').trim()) this.errors['firstName'] = 'This field is required';
    if (!String(v.lastName ?? '').trim()) this.errors['lastName'] = 'This field is required';
    if (!String(v.phone ?? '').trim()) this.errors['phone'] = 'This field is required';
    if (!String(v.location ?? '').trim()) this.errors['location'] = 'This field is required';
    if (!String(v.gender ?? '').trim()) this.errors['gender'] = 'This field is required';
    return Object.keys(this.errors).length === 0;
  }

  private validateCareerInformation(): boolean {
    const v = this.profileForm.getRawValue();
    if (!String(v.jobTitle ?? '').trim()) this.errors['jobTitle'] = 'This field is required';
    if (!String(v.company ?? '').trim()) this.errors['company'] = 'This field is required';
    if (!String(v.yearsOfExperience ?? '').trim()) this.errors['yearsOfExperience'] = 'This field is required';
    if (!this.validateWorkHistoryRows()) return false;
    return Object.keys(this.errors).length === 0;
  }

  private validateBiographyExpertise(): boolean {
    const v = this.profileForm.getRawValue();
    const bio = String(v.bio ?? '').trim();
    if (!bio) this.errors['bio'] = 'This field is required';
    else if (bio.length < 50) this.errors['bio'] = 'Biography must be at least 50 characters';
    if (!this.skills.length) this.errors['skills'] = 'Add at least one skill (press Enter)';
    return Object.keys(this.errors).length === 0;
  }

  openPayoutDialog(): void {
    const payoutAccount = this.mentorData.data.payoutAccount;
    this.payoutForm.patchValue({
      type: payoutAccount.type,
      bankName: payoutAccount.bankName ?? '',
      accountNumber: payoutAccount.accountNumber ?? '',
      instapayNumber: payoutAccount.instapayNumber ?? '',
    });
    this.updatePayoutValidators();
    this.payoutDialogOpen = true;
    this.cdr.markForCheck();
  }

  onPayoutTypeChange(): void {
    this.updatePayoutValidators();
    this.cdr.markForCheck();
  }

  closePayoutDialog(): void {
    this.payoutDialogOpen = false;
    this.cdr.markForCheck();
  }

  private updatePayoutValidators(): void {
    const type = this.payoutForm.get('type')?.value;
    const bankName = this.payoutForm.get('bankName');
    const accountNumber = this.payoutForm.get('accountNumber');
    const instapayNumber = this.payoutForm.get('instapayNumber');
    if (type === 'bank') {
      bankName?.setValidators([Validators.required]);
      accountNumber?.setValidators([Validators.required, Validators.minLength(8)]);
      instapayNumber?.clearValidators();
    } else {
      bankName?.clearValidators();
      accountNumber?.clearValidators();
      instapayNumber?.setValidators([Validators.required, Validators.minLength(10)]);
    }
    bankName?.updateValueAndValidity();
    accountNumber?.updateValueAndValidity();
    instapayNumber?.updateValueAndValidity();
  }

  onSavePayout(): void {
    if (this.payoutForm.invalid) return;
    const v = this.payoutForm.getRawValue();
    const payoutAccount = v.type === 'bank'
      ? { type: 'bank' as const, bankName: v.bankName, accountNumber: v.accountNumber }
      : { type: 'instapay' as const, instapayNumber: v.instapayNumber };
    this.mentorData.setPayoutAccount(payoutAccount);
    this.closePayoutDialog();
    this.toast.success('Payout account updated successfully.');
    this.cdr.markForCheck();
  }
}
