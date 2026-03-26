import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastService } from '../../../shared/services/toast.service';
import { Observable, Subject, combineLatest, map, take, filter } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
import { DEFAULT_MENTEE_CAPACITY } from '../../../core/constants';
import { parseMenteeCapacity } from '../../../core/utils/mentor.utils';
import { updateProfile } from '../../auth/store/auth.actions';
import type { User, MentorPlan, UserExperience } from '../../../core/models/user.model';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

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

        <!-- Personal Information -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-5">Personal Information</h2>
          <div class="flex items-start gap-6 mb-6">
            <div class="shrink-0">
              @if (avatarPreview) {
                <img [src]="avatarPreview" [alt]="user.name" class="w-20 h-20 rounded-lg object-cover" />
              } @else if (isAvatarUrl(user.avatar)) {
                <img [src]="user.avatar" [alt]="user.name" class="w-20 h-20 rounded-lg object-cover" />
              } @else {
                <div class="w-20 h-20 bg-primary rounded-lg flex items-center justify-center">
                  <span class="text-primary-foreground text-2xl font-semibold">{{ getInitials(user.name) }}</span>
                </div>
              }
              <label
                class="block mt-2 text-center text-xs text-primary cursor-pointer hover:underline">
                {{ avatarUploading ? 'Uploading...' : 'Change photo' }}
                <input type="file" accept="image/jpeg,image/png" (change)="onAvatarSelected($event)" class="hidden" [disabled]="avatarUploading" />
              </label>
              @if (avatarError) {
                <p class="text-xs text-destructive mt-1">{{ avatarError }}</p>
              }
            </div>
            <div class="flex-1 grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <input type="text" [(ngModel)]="form.name"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input type="email" [value]="user.email" disabled
                  class="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-muted-foreground" />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                <input type="tel" [(ngModel)]="form.phone" placeholder="+1 (555) 000-0000"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Location</label>
                <input type="text" [(ngModel)]="form.location" placeholder="City, Country"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Gender</label>
                <select [(ngModel)]="form.gender"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
          <div class="flex justify-end">
            <button type="button" (click)="onSavePersonal()"
              class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Save Changes
            </button>
          </div>
        </div>

        <!-- Career Information -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-5">Career Information</h2>
          <div class="grid sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Current Job Title</label>
              <input type="text" [(ngModel)]="form.jobTitle" placeholder="Senior Software Engineer"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Current Company</label>
              <input type="text" [(ngModel)]="form.company" placeholder="Tech Corp"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Years of Experience</label>
              <input type="number" min="0" [(ngModel)]="form.yearsOfExperience" placeholder="5"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
            </div>
          </div>

          <!-- Work History -->
          <div class="border-t border-border pt-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-foreground">Work History</h3>
              <button type="button" (click)="addExperience()"
                class="py-1.5 px-3 text-sm border border-border text-foreground rounded-md hover:bg-muted">
                + Add Experience
              </button>
            </div>
            <div class="space-y-4">
              @for (exp of form.experiences; track exp.id; let i = $index) {
                <div class="border border-border rounded-lg p-4">
                  <div class="flex items-start justify-between mb-3">
                    <span class="text-xs text-muted-foreground">Experience {{ i + 1 }}</span>
                    <button type="button" (click)="removeExperience(exp)" [disabled]="form.experiences.length <= 1"
                      class="p-1 text-muted-foreground hover:text-destructive disabled:opacity-40">
                      <fa-icon [icon]="['fas', 'trash']" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div class="grid sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label class="text-xs text-muted-foreground">Title</label>
                      <input type="text" [(ngModel)]="exp.title" placeholder="Software Engineer"
                        class="w-full px-3 py-2 bg-input-background border border-border rounded-md text-sm" />
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground">Company</label>
                      <input type="text" [(ngModel)]="exp.company" placeholder="Company name"
                        class="w-full px-3 py-2 bg-input-background border border-border rounded-md text-sm" />
                    </div>
                  </div>
                  <div class="grid sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label class="text-xs text-muted-foreground">Start Date</label>
                      <input type="month" [(ngModel)]="exp.startDate"
                        class="w-full px-3 py-2 bg-input-background border border-border rounded-md text-sm" />
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground">End Date</label>
                      <input type="month" [(ngModel)]="exp.endDate" [disabled]="exp.current"
                        class="w-full px-3 py-2 bg-input-background border border-border rounded-md text-sm disabled:opacity-50" />
                    </div>
                    <div class="flex items-end pb-1">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" [(ngModel)]="exp.current"
                          class="rounded border-border text-primary focus:ring-ring" />
                        <span class="text-sm text-foreground">Current position</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label class="text-xs text-muted-foreground">Description</label>
                    <textarea [(ngModel)]="exp.description" rows="2" placeholder="Brief description of your role..."
                      class="w-full px-3 py-2 bg-input-background border border-border rounded-md text-sm resize-none"></textarea>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button type="button" (click)="onSaveCareer()"
              class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Save Changes
            </button>
          </div>
        </div>

        <!-- Bio & Expertise -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-5">Bio &amp; Expertise</h2>
          <div class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Professional Biography</label>
              <textarea [(ngModel)]="form.bio" rows="5"
                placeholder="Tell mentees about your professional journey..."
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md resize-none"></textarea>
            </div>

            <!-- Skills -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Skills &amp; Expertise</label>
              <p class="text-xs text-muted-foreground mb-2">Press Enter to add</p>
              <input type="text" [(ngModel)]="skillInput" (keydown.enter)="addSkill($event)"
                placeholder="Type a skill and press Enter"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              @if (form.skills.length > 0) {
                <div class="flex flex-wrap gap-2 mt-3">
                  @for (skill of form.skills; track skill) {
                    <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm">
                      {{ skill }}
                      <button type="button" (click)="removeSkill(skill)" class="hover:text-primary">
                        <fa-icon [icon]="['fas', 'xmark']" class="w-3 h-3" />
                      </button>
                    </span>
                  }
                </div>
              }
            </div>

            <!-- Tools -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Tools &amp; Technologies</label>
              <input type="text" [(ngModel)]="toolInput" (keydown.enter)="addTool($event)"
                placeholder="Type a tool and press Enter"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              @if (form.tools.length > 0) {
                <div class="flex flex-wrap gap-2 mt-3">
                  @for (tool of form.tools; track tool) {
                    <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground rounded-md text-sm">
                      {{ tool }}
                      <button type="button" (click)="removeTool(tool)" class="hover:text-foreground">
                        <fa-icon [icon]="['fas', 'xmark']" class="w-3 h-3" />
                      </button>
                    </span>
                  }
                </div>
              }
            </div>

            <!-- Links -->
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Portfolio / Website</label>
                <input type="url" [(ngModel)]="form.portfolioUrl" placeholder="https://yourportfolio.com"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">LinkedIn</label>
                <input type="url" [(ngModel)]="form.linkedin" placeholder="https://linkedin.com/in/username"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <button type="button" (click)="onSaveBio()"
              class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Save Changes
            </button>
          </div>
        </div>

        <!-- Mentorship Preferences -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-5">Mentorship Preferences</h2>
          <div class="space-y-6">

            <!-- Pricing Plans -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Pricing Plans</label>
              <p class="text-xs text-muted-foreground mb-3">Up to 3 subscription plans</p>
              <div class="space-y-3">
                @for (plan of form.mentorPlans; track plan.id; let i = $index) {
                  <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div class="w-full sm:w-40">
                      <label class="text-xs text-muted-foreground">Duration</label>
                      <select [(ngModel)]="plan.duration"
                        class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md">
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="6months">6 months</option>
                      </select>
                    </div>
                    <div class="flex-1 w-full">
                      <label class="text-xs text-muted-foreground">Price (USD)</label>
                      <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <input type="number" min="1" [(ngModel)]="plan.price" placeholder="150"
                          class="w-full pl-8 pr-4 py-2.5 bg-input-background border border-border rounded-md" />
                      </div>
                    </div>
                    <button type="button" (click)="removePlan(plan)"
                      [disabled]="form.mentorPlans.length === 1"
                      class="p-2.5 border border-border rounded-md hover:bg-muted disabled:opacity-40">
                      <fa-icon [icon]="['fas', 'xmark']" class="w-4 h-4" />
                    </button>
                  </div>
                }
              </div>
              @if (form.mentorPlans.length < 3) {
                <button type="button" (click)="addPlan()"
                  class="mt-3 py-2 px-4 text-sm border border-border text-foreground rounded-md hover:bg-muted">
                  + Add Plan
                </button>
              }
            </div>

            <!-- Capacity (read-only, set by admin) -->
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Mentee Capacity</label>
                <div class="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-foreground">
                  {{ mentorCapacity$ | async }} mentees at a time
                </div>
                <p class="text-xs text-muted-foreground mt-1">Capacity is set by the platform administrator</p>
              </div>
              <div class="flex items-end pb-0.5">
                <p class="text-sm text-muted-foreground">
                  {{ spotsAvailable$ | async }} of {{ mentorCapacity$ | async }} spots available
                </p>
              </div>
            </div>

            <!-- Accepting toggle -->
            <div class="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p class="text-foreground font-medium">Accepting New Mentees</p>
                <p class="text-muted-foreground text-sm">Toggle off to pause new requests</p>
              </div>
              <button type="button"
                [class]="(acceptingNewMentees$ | async) ? 'bg-primary' : 'bg-muted'"
                class="relative w-11 h-6 rounded-full transition-colors inline-flex items-center"
                (click)="toggleAccepting()">
                <span [class]="(acceptingNewMentees$ | async) ? 'translate-x-6' : 'translate-x-0.5'"
                  class="absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform"></span>
              </button>
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <button type="button" (click)="onSavePreferences()"
              class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Save Changes
            </button>
          </div>
        </div>

        <!-- Payout Account -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-4">Payout Account</h2>
          <p class="text-muted-foreground text-sm mb-4">Where your earnings will be deposited.</p>
          <div class="flex items-center gap-4 p-4 bg-muted/50 rounded-lg mb-4">
            @if ((payoutAccount$ | async); as pa) {
              @if (pa.type === 'bank') {
                <div class="w-12 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
                  <span class="text-white text-xs font-bold">BANK</span>
                </div>
                <p class="text-foreground text-sm font-medium">{{ pa.bankName }} •••• {{ pa.accountNumber?.slice(-4) ?? '----' }}</p>
              } @else {
                <div class="w-12 h-8 bg-indigo-600 rounded flex items-center justify-center shrink-0">
                  <span class="text-white text-xs font-bold">INSTAPAY</span>
                </div>
                <div>
                  <p class="text-foreground text-sm font-medium">•••• {{ pa.instapayNumber?.slice(-4) ?? '----' }}</p>
                  <p class="text-muted-foreground text-xs">Instapay</p>
                </div>
              }
            } @else {
              <p class="text-sm text-muted-foreground">No payout account set up yet.</p>
            }
          </div>
          <button type="button" (click)="openPayoutDialog()"
            class="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-muted">
            Update Payout Account
          </button>
        </div>

      }
    </div>

    <!-- Payout Account Dialog -->
    @if (payoutDialogOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div class="absolute inset-0 bg-foreground/50 backdrop-blur-sm" (click)="closePayoutDialog()"></div>
        <div class="relative bg-card rounded-lg shadow-xl border border-border max-w-md w-full p-6" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-medium text-foreground mb-4">Update Payout Account</h2>
          <form [formGroup]="payoutForm" (ngSubmit)="onSavePayout()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Account Type <span class="text-destructive">*</span></label>
              <select formControlName="type" (change)="onPayoutTypeChange()"
                class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm">
                <option value="bank">Bank Account</option>
                <option value="instapay">Instapay</option>
              </select>
            </div>
            @if (payoutForm.get('type')?.value === 'bank') {
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Bank Name <span class="text-destructive">*</span></label>
                <input formControlName="bankName" type="text" placeholder="e.g. Chase Bank"
                  class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm" />
                @if (payoutForm.get('bankName')?.invalid && payoutForm.get('bankName')?.touched) {
                  <p class="text-destructive text-xs mt-1">Bank name is required (min 2 characters)</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Account Number <span class="text-destructive">*</span></label>
                <input formControlName="accountNumber" type="text" placeholder="Account number (10-20 digits)"
                  class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm" />
                @if (payoutForm.get('accountNumber')?.invalid && payoutForm.get('accountNumber')?.touched) {
                  <p class="text-destructive text-xs mt-1">Account number required (10-20 digits)</p>
                }
              </div>
            } @else {
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Instapay Number <span class="text-destructive">*</span></label>
                <input formControlName="instapayNumber" type="text" placeholder="01xxxxxxxxx"
                  class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm" />
                @if (payoutForm.get('instapayNumber')?.invalid && payoutForm.get('instapayNumber')?.touched) {
                  <p class="text-destructive text-xs mt-1">Instapay number required (starts with 01, 11 digits)</p>
                }
              </div>
            }
            <div class="flex justify-end gap-3 pt-4">
              <button type="button" (click)="closePayoutDialog()"
                class="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted">Cancel</button>
              <button type="submit" [disabled]="payoutForm.invalid"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50">Save</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorSettingsPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly toast = inject(ToastService);
  private readonly authApi = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroy$ = new Subject<void>();

  readonly user$: Observable<User | null> = this.store.select(selectAuthUser);
  readonly payoutAccount$ = this.store.select(selectMentorPayoutAccount);
  readonly acceptingNewMentees$ = this.store.select(selectMentorAcceptingNewMentees);
  readonly defaultCapacity = DEFAULT_MENTEE_CAPACITY;

  readonly mentorCapacity$ = this.store.select(selectAuthUser).pipe(
    map((u) => parseMenteeCapacity(u?.menteeCapacity)),
  );
  readonly spotsAvailable$ = combineLatest([
    this.mentorCapacity$,
    this.store.select(selectMyMenteesActive),
  ]).pipe(map(([cap, active]) => Math.max(0, cap - active.length)));

  form = {
    name: '',
    phone: '',
    location: '',
    gender: '',
    jobTitle: '',
    company: '',
    yearsOfExperience: '',
    bio: '',
    skills: [] as string[],
    tools: [] as string[],
    portfolioUrl: '',
    linkedin: '',
    mentorPlans: [] as MentorPlan[],
    menteeCapacity: '',
    experiences: [] as UserExperience[],
  };

  skillInput = '';
  toolInput = '';
  avatarPreview: string | null = null;
  avatarError = '';
  avatarUploading = false;
  private currentUserId: string | null = null;
  payoutDialogOpen = false;

  payoutForm: FormGroup = this.fb.group({
    type: ['bank' as const, Validators.required],
    bankName: ['', [Validators.required, Validators.minLength(2)]],
    accountNumber: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(20), Validators.pattern(/^\d+$/)]],
    instapayNumber: [''],
  });

  ngOnInit(): void {
    this.user$.pipe(filter((u): u is User => u != null), take(1)).subscribe((user) => {
      this.currentUserId = user.id;
      this.form = {
        name: user.name ?? '',
        phone: user.phone ?? '',
        location: user.location ?? '',
        gender: user.gender ?? '',
        jobTitle: user.jobTitle ?? '',
        company: user.company ?? '',
        yearsOfExperience: user.yearsOfExperience ?? '',
        bio: user.bio ?? '',
        skills: [...(user.skills ?? [])],
        tools: [...(user.tools ?? [])],
        portfolioUrl: user.portfolioUrl ?? '',
        linkedin: user.linkedin ?? '',
        mentorPlans: user.mentorPlans?.length
          ? user.mentorPlans.map((p) => ({ ...p }))
          : [this.createPlan('monthly', user.subscriptionCost ?? '')],
        menteeCapacity: user.menteeCapacity ?? '',
        experiences: user.experiences?.length
          ? user.experiences.map((e) => ({ ...e }))
          : [this.createExperience()],
      };
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Experiences ──────────────────────────────────────────────────
  createExperience(): UserExperience {
    return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title: '', company: '', startDate: '', endDate: '', current: false, description: '' };
  }

  addExperience(): void {
    this.form.experiences = [...this.form.experiences, this.createExperience()];
  }

  async removeExperience(exp: UserExperience): Promise<void> {
    if (this.form.experiences.length <= 1) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove Experience',
      message: `Remove ${exp.title || 'this experience'}?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      this.form.experiences = this.form.experiences.filter((e) => e.id !== exp.id);
      this.cdr.markForCheck();
    }
  }

  // ── Skills / Tools ──────────────────────────────────────────────
  addSkill(event: Event): void {
    event.preventDefault();
    const v = this.skillInput.trim();
    if (v && !this.form.skills.some((s) => s.toLowerCase() === v.toLowerCase())) {
      this.form.skills = [...this.form.skills, v];
    }
    this.skillInput = '';
  }

  removeSkill(skill: string): void {
    this.form.skills = this.form.skills.filter((s) => s !== skill);
  }

  addTool(event: Event): void {
    event.preventDefault();
    const v = this.toolInput.trim();
    if (v && !this.form.tools.some((t) => t.toLowerCase() === v.toLowerCase())) {
      this.form.tools = [...this.form.tools, v];
    }
    this.toolInput = '';
  }

  removeTool(tool: string): void {
    this.form.tools = this.form.tools.filter((t) => t !== tool);
  }

  // ── Plans ────────────────────────────────────────────────────────
  createPlan(duration: 'monthly' | 'quarterly' | '6months' = 'monthly', price = ''): MentorPlan {
    return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, duration, price };
  }

  addPlan(): void {
    if (this.form.mentorPlans.length < 3) {
      this.form.mentorPlans = [...this.form.mentorPlans, this.createPlan()];
    }
  }

  async removePlan(plan: MentorPlan): Promise<void> {
    if (this.form.mentorPlans.length <= 1) return;
    const label = plan.duration === 'monthly' ? 'Monthly' : plan.duration === 'quarterly' ? 'Quarterly' : '6 months';
    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove Plan',
      message: `Remove the ${label} plan?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      this.form.mentorPlans = this.form.mentorPlans.filter((p) => p.id !== plan.id);
      this.cdr.markForCheck();
    }
  }

  // ── Avatar upload ────────────────────────────────────────────────
  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarError = '';

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.avatarError = 'Only JPG and PNG files are allowed.';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.avatarError = 'File must be under 10 MB.';
      return;
    }
    if (!this.currentUserId) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    this.avatarUploading = true;
    this.authApi.uploadProfilePhoto(this.currentUserId, file).pipe(take(1)).subscribe({
      next: (url) => {
        this.store.dispatch(updateProfile({ updates: { avatar: url } }));
        this.avatarUploading = false;
        this.toast.success('Profile photo updated.');
        this.cdr.markForCheck();
      },
      error: () => {
        this.avatarError = 'Upload failed. Please try again.';
        this.avatarUploading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Save handlers ─────────────────────────────────────────────────
  onSavePersonal(): void {
    this.store.dispatch(updateProfile({
      updates: { name: this.form.name, phone: this.form.phone, location: this.form.location, gender: this.form.gender },
    }));
    this.toast.success('Personal information updated.');
  }

  onSaveCareer(): void {
    this.store.dispatch(updateProfile({
      updates: {
        jobTitle: this.form.jobTitle,
        company: this.form.company,
        yearsOfExperience: this.form.yearsOfExperience,
        experiences: this.form.experiences.filter((e) => e.title || e.company),
      },
    }));
    this.toast.success('Career information updated.');
  }

  onSaveBio(): void {
    this.store.dispatch(updateProfile({
      updates: { bio: this.form.bio, skills: this.form.skills, tools: this.form.tools, portfolioUrl: this.form.portfolioUrl, linkedin: this.form.linkedin },
    }));
    this.toast.success('Bio & expertise updated.');
  }

  onSavePreferences(): void {
    const primaryPlan = this.form.mentorPlans.find((p) => p.duration === 'monthly') ?? this.form.mentorPlans[0];
    this.store.dispatch(updateProfile({
      updates: {
        mentorPlans: this.form.mentorPlans,
        subscriptionCost: primaryPlan?.price ?? undefined,
      },
    }));
    this.toast.success('Mentorship preferences updated.');
  }

  // ── Accepting toggle ──────────────────────────────────────────
  toggleAccepting(): void {
    this.acceptingNewMentees$.pipe(take(1)).subscribe((accepting) => {
      const newValue = !accepting;
      this.user$.pipe(take(1)).subscribe((user) => {
        if (!user) return;
        this.authApi.updateMentorAccepting(user.id, newValue).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.store.dispatch(setMentorAcceptingNewMentees({ accepting: newValue }));
            this.cdr.markForCheck();
          },
          error: () => this.toast.error('Failed to update availability. Please try again.'),
        });
      });
    });
  }

  // ── Payout ───────────────────────────────────────────────────────
  openPayoutDialog(): void {
    this.payoutAccount$.pipe(take(1)).subscribe((pa) => {
      this.payoutForm.patchValue({
        type: pa?.type ?? 'bank',
        bankName: pa?.bankName ?? '',
        accountNumber: pa?.accountNumber ?? '',
        instapayNumber: pa?.instapayNumber ?? '',
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

  onSavePayout(): void {
    if (this.payoutForm.invalid) return;
    const v = this.payoutForm.getRawValue();
    const payoutAccount = v.type === 'bank'
      ? { type: 'bank' as const, bankName: v.bankName, accountNumber: v.accountNumber }
      : { type: 'instapay' as const, instapayNumber: v.instapayNumber };
    this.user$.pipe(take(1)).subscribe((user) => {
      if (!user) return;
      this.authApi.updateMentorPayoutAccount(user.id, payoutAccount as Record<string, unknown>).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.store.dispatch(updateMentorPayoutAccount({ payoutAccount }));
          this.closePayoutDialog();
          this.toast.success('Payout account updated successfully.');
        },
        error: () => this.toast.error('Failed to save payout account. Please try again.'),
      });
    });
  }

  private updatePayoutValidators(): void {
    const type = this.payoutForm.get('type')?.value;
    const bankName = this.payoutForm.get('bankName');
    const accountNumber = this.payoutForm.get('accountNumber');
    const instapayNumber = this.payoutForm.get('instapayNumber');
    if (type === 'bank') {
      bankName?.setValidators([Validators.required, Validators.minLength(2)]);
      accountNumber?.setValidators([Validators.required, Validators.minLength(10), Validators.maxLength(20), Validators.pattern(/^\d+$/)]);
      instapayNumber?.clearValidators();
    } else {
      bankName?.clearValidators();
      accountNumber?.clearValidators();
      instapayNumber?.setValidators([Validators.required, Validators.pattern(/^01\d{9}$/)]);
    }
    bankName?.updateValueAndValidity();
    accountNumber?.updateValueAndValidity();
    instapayNumber?.updateValueAndValidity();
  }

  // ── Helpers ──────────────────────────────────────────────────────
  isAvatarUrl(avatar: string | undefined): boolean {
    return !!avatar && (avatar.startsWith('http') || avatar.startsWith('/'));
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
