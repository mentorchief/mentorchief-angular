import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastService } from '../../../shared/services/toast.service';
import { Observable, combineLatest, map, take, filter } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectAuthUser } from '../../auth/store/auth.selectors';
import {
  selectMyMenteesActive,
  selectMentorPayoutAccount,
  selectMentorAcceptingNewMentees,
} from '../store/dashboard.selectors';
import {
  updateMentorPayoutAccount,
  setMentorAcceptingNewMentees,
} from '../store/dashboard.actions';
import { DEFAULT_SAMPLE_PRICE, DEFAULT_MENTEE_CAPACITY } from '../../../core/constants';
import { parseMenteeCapacity } from '../../../core/utils/mentor.utils';
import { updateProfile } from '../../auth/store/auth.actions';
import type { User } from '../../../core/models/user.model';

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
        <!-- Profile Section -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-4">Profile Information</h2>
          <div class="flex items-start gap-6">
            <div class="w-20 h-20 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span class="text-primary-foreground text-2xl font-semibold">{{ getInitials(user.name) }}</span>
            </div>
            <div class="flex-1 space-y-4">
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input type="text" [ngModel]="profileForm.get('name')?.value" (ngModelChange)="profileForm.patchValue({ name: $event })" name="profileName" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input type="email" [value]="user.email" disabled class="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-muted-foreground" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Professional Title</label>
                <input type="text" [ngModel]="profileForm.get('jobTitle')?.value" (ngModelChange)="profileForm.patchValue({ jobTitle: $event })" name="profileJobTitle" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" placeholder="e.g., Senior Software Engineer" />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Bio</label>
                <textarea rows="4" [ngModel]="profileForm.get('bio')?.value" (ngModelChange)="profileForm.patchValue({ bio: $event })" name="profileBio" placeholder="Tell mentees about yourself..." class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md"></textarea>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <button type="button" (click)="onSaveProfile()" class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">Save Changes</button>
          </div>
        </div>

        <!-- Mentorship Settings -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-4">Mentorship Settings</h2>
          <div class="space-y-4">
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Monthly Rate</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input type="number" [ngModel]="profileForm.get('subscriptionCost')?.value" (ngModelChange)="profileForm.patchValue({ subscriptionCost: $event })" name="subscriptionCost" class="w-full pl-8 pr-4 py-2.5 bg-input-background border border-border rounded-md" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Mentee Capacity</label>
                <select
                  [ngModel]="user.menteeCapacity ?? ''"
                  (ngModelChange)="onMenteeCapacityChange($event)"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md"
                >
                  <option value="">Select capacity</option>
                  <option value="1">1 mentee at a time</option>
                  <option value="2-3">2-3 mentees at a time</option>
                  <option value="4-5">4-5 mentees at a time</option>
                  <option value="6-10">6-10 mentees at a time</option>
                  <option value="10+">10+ mentees at a time</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Expertise Areas</label>
              <div class="flex flex-wrap gap-2">
                @for (skill of (user.skills ?? []); track skill) {
                  <span class="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm flex items-center gap-1.5">
                    {{ skill }}
                    <button type="button" class="hover:text-destructive"><fa-icon [icon]="['fas', 'xmark']" class="w-3.5 h-3.5" /></button>
                  </span>
                }
                @if ((user.skills ?? []).length === 0) {
                  <p class="text-sm text-muted-foreground">No expertise added yet.</p>
                }
                <button type="button" class="px-3 py-1.5 border border-dashed border-border text-muted-foreground rounded-md text-sm hover:border-primary hover:text-primary">
                  + Add Skill
                </button>
              </div>
            </div>
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
            } @else {
              <p class="text-muted-foreground text-sm">No payout account set yet.</p>
            }
          </div>
          <button type="button" (click)="openPayoutDialog()" class="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-muted">
            Update Payout Account
          </button>
        </div>

        <!-- Availability -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-4">Availability</h2>
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
          <p class="text-muted-foreground text-sm">
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
  private readonly store = inject(Store<AppState>);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  readonly user$: Observable<User | null> = this.store.select(selectAuthUser);
  readonly payoutAccount$ = this.store.select(selectMentorPayoutAccount);
  readonly acceptingNewMentees$ = this.store.select(selectMentorAcceptingNewMentees);
  readonly defaultSamplePrice = DEFAULT_SAMPLE_PRICE;
  readonly defaultCapacity = DEFAULT_MENTEE_CAPACITY;
  readonly mentorCapacity$ = this.store.select(selectAuthUser).pipe(
    map((u) => parseMenteeCapacity(u?.menteeCapacity)),
  );
  readonly spotsAvailable$ = combineLatest([
    this.mentorCapacity$,
    this.store.select(selectMyMenteesActive),
  ]).pipe(map(([cap, active]) => Math.max(0, cap - active.length)));

  payoutDialogOpen = false;
  profileForm: FormGroup = this.fb.group({
    name: [''],
    jobTitle: [''],
    bio: [''],
    subscriptionCost: [''],
  });
  payoutForm: FormGroup = this.fb.group({
    type: ['bank' as const, Validators.required],
    bankName: ['', Validators.required],
    accountNumber: ['', [Validators.required, Validators.minLength(8)]],
    instapayNumber: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit(): void {
    this.user$.pipe(filter((u): u is User => u != null), take(1)).subscribe((user) => {
      const cost = user.subscriptionCost ?? this.defaultSamplePrice;
      this.profileForm.patchValue({
        name: user.name,
        jobTitle: user.jobTitle ?? '',
        bio: user.bio ?? '',
        subscriptionCost: cost,
      });
      this.cdr.markForCheck();
    });
  }

  toggleAccepting(): void {
    this.acceptingNewMentees$.pipe(take(1)).subscribe((accepting) => {
      this.store.dispatch(setMentorAcceptingNewMentees({ accepting: !accepting }));
      this.cdr.markForCheck();
    });
  }

  onMenteeCapacityChange(value: string): void {
    this.store.dispatch(updateProfile({ updates: { menteeCapacity: value } }));
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  onSaveProfile(): void {
    const v = this.profileForm.getRawValue();
    this.store.dispatch(updateProfile({
      updates: {
        name: v.name,
        jobTitle: v.jobTitle || undefined,
        bio: v.bio || undefined,
        subscriptionCost: v.subscriptionCost ? Number(v.subscriptionCost) : undefined,
      },
    }));
    this.toast.success('Profile updated successfully.');
    this.cdr.markForCheck();
  }

  openPayoutDialog(): void {
    this.payoutAccount$.pipe(take(1)).subscribe((payoutAccount) => {
      this.payoutForm.patchValue({
        type: payoutAccount?.type ?? 'bank',
        bankName: payoutAccount?.bankName ?? '',
        accountNumber: payoutAccount?.accountNumber ?? '',
        instapayNumber: payoutAccount?.instapayNumber ?? '',
      });
      this.updatePayoutValidators();
      this.payoutDialogOpen = true;
      this.cdr.markForCheck();
    });
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
    this.store.dispatch(updateMentorPayoutAccount({ payoutAccount }));
    this.closePayoutDialog();
    this.toast.success('Payout account updated successfully.');
    this.cdr.markForCheck();
  }
}
