import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastService } from '../../../shared/services/toast.service';
import type { User } from '../../../core/models/user.model';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { displayNameParts } from '../../../core/utils/user-display.utils';
import { Observable, filter, take } from 'rxjs';

@Component({
  selector: 'mc-mentee-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FontAwesomeModule],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">Settings</h1>
        <p class="text-muted-foreground mt-1">Edit the same information you entered during registration</p>
      </div>

      @if (user$ | async; as user) {
        <p class="text-sm text-muted-foreground mb-6 pb-4 border-b border-border">
          Each section matches registration. Save after editing — personal information, background, then about you (mentees have no pricing step).
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
              <input type="file" accept="image/*" class="hidden" #menteeAvatarInput (change)="onAvatarSelected($event)" aria-hidden="true" />
              <button type="button" class="w-48 px-3 py-2 text-xs bg-input-background border border-border rounded-md hover:bg-muted" (click)="menteeAvatarInput.click()" aria-label="Upload profile photo">Upload photo</button>
            </div>
            <div class="flex-1 space-y-4">
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">First name <span class="text-destructive">*</span></label>
                  <input type="text" [formControl]="profileForm.controls.firstName" [class.border-destructive]="errors['firstName']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
                  @if (errors['firstName']) { <p class="text-xs text-destructive mt-1">{{ errors['firstName'] }}</p> }
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">Last name <span class="text-destructive">*</span></label>
                  <input type="text" [formControl]="profileForm.controls.lastName" [class.border-destructive]="errors['lastName']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
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
                  <input type="text" [formControl]="profileForm.controls.phone" placeholder="+1 (555) 000-0000" [class.border-destructive]="errors['phone']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
                  @if (errors['phone']) { <p class="text-xs text-destructive mt-1">{{ errors['phone'] }}</p> }
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">Country <span class="text-destructive">*</span></label>
                  <select [formControl]="profileForm.controls.location" [class.border-destructive]="errors['location']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md">
                    <option value="">Select country</option>
                    @for (country of countries; track country) { <option [value]="country">{{ country }}</option> }
                  </select>
                  @if (errors['location']) { <p class="text-xs text-destructive mt-1">{{ errors['location'] }}</p> }
                </div>
              </div>
              <div class="max-w-md">
                <label class="block text-sm font-medium text-foreground mb-1.5">Gender <span class="text-destructive">*</span></label>
                <select [formControl]="profileForm.controls.gender" [class.border-destructive]="errors['gender']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md">
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

        <!-- Background / career (mentee registration labels) -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-1">Background information</h2>
          <p class="text-sm text-muted-foreground mb-4">Current role, organization, and years in the field — same as registration.</p>
          <div class="space-y-4 max-w-2xl">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Current role <span class="text-destructive">*</span></label>
              <input type="text" [formControl]="profileForm.controls.jobTitle" placeholder="Student / Junior Developer" [class.border-destructive]="errors['jobTitle']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              @if (errors['jobTitle']) { <p class="text-xs text-destructive mt-1">{{ errors['jobTitle'] }}</p> }
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Organization / University <span class="text-destructive">*</span></label>
              <input type="text" [formControl]="profileForm.controls.company" placeholder="University / Company" [class.border-destructive]="errors['company']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              @if (errors['company']) { <p class="text-xs text-destructive mt-1">{{ errors['company'] }}</p> }
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Years in field <span class="text-destructive">*</span></label>
              <input
                type="number"
                min="0"
                step="1"
                [formControl]="profileForm.controls.yearsOfExperience"
                [class.border-destructive]="errors['yearsOfExperience']"
                class="w-full max-w-xs px-4 py-2.5 bg-input-background border border-border rounded-md"
              />
              <p class="text-xs text-muted-foreground mt-1.5">Enter 0 if you are just starting out (same as registration).</p>
              @if (errors['yearsOfExperience']) { <p class="text-xs text-destructive mt-1">{{ errors['yearsOfExperience'] }}</p> }
            </div>
          </div>
          <div class="mt-6 flex justify-end border-t border-border pt-6">
            <button type="button" (click)="onSaveCareerInformation()" class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">Save background information</button>
          </div>
        </div>

        <!-- About you / biography -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-1">About you</h2>
          <p class="text-sm text-muted-foreground mb-4">Biography, skills (Enter to add), tools, and portfolio — same as registration.</p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">About me <span class="text-destructive">*</span></label>
              <textarea rows="6" [formControl]="profileForm.controls.bio" placeholder="Tell us about yourself and your goals..." [class.border-destructive]="errors['bio']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md"></textarea>
              <p class="text-xs text-muted-foreground mt-1">{{ (profileForm.get('bio')?.value || '').length }} / 500 (min 50)</p>
              @if (errors['bio']) { <p class="text-xs text-destructive mt-1">{{ errors['bio'] }}</p> }
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-foreground">Skills &amp; interests <span class="text-destructive">*</span></label>
              <p class="text-xs text-muted-foreground">Type a skill and press Enter to add (same as registration).</p>
              <input type="text" [(ngModel)]="skillInput" (keydown.enter)="addSkill($event)" [class.border-destructive]="errors['skills']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" placeholder="e.g. Product discovery" />
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
              <label class="block text-sm font-medium text-foreground">Tools &amp; technologies <span class="text-muted-foreground font-normal">(optional)</span></label>
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
                Optional. Use your full LinkedIn profile URL when you want it visible to mentors.
              </p>
              <input
                type="url"
                [formControl]="profileForm.controls.linkedin"
                placeholder="https://www.linkedin.com/in/your-profile"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md"
              />
            </div>
          </div>
          <div class="mt-6 flex justify-end border-t border-border pt-6">
            <button type="button" (click)="onSaveBiographyExpertise()" class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">Save about you &amp; skills</button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenteeSettingsPageComponent implements OnInit {
  private readonly auth = inject(AuthFacade);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly user$: Observable<User | null> = this.auth.currentUser$;
  readonly countries = ['United States','United Kingdom','Canada','Australia','Germany','France','India','Japan','Brazil','Netherlands','Singapore','Sweden','Switzerland','Spain','Italy','South Korea','China','Mexico','Indonesia','Poland','Turkey','Nigeria','Egypt','South Africa','Kenya','Argentina','Chile','Colombia','Other'];

  readonly profileForm = this.fb.nonNullable.group({
    firstName: [''],
    lastName: [''],
    avatar: [''],
    phone: [''],
    location: [''],
    gender: [''],
    jobTitle: [''],
    company: [''],
    yearsOfExperience: [''],
    bio: [''],
    linkedin: [''],
  });

  skills: string[] = [];
  tools: string[] = [];
  skillInput = '';
  toolInput = '';
  errors: Record<string, string> = {};

  ngOnInit(): void {
    this.user$.pipe(filter((u): u is User => u != null), take(1)).subscribe((user) => {
      const { firstName, lastName } = displayNameParts(user);
      this.profileForm.patchValue({
        firstName,
        lastName,
        avatar: user.avatar ?? '',
        phone: user.phone ?? '',
        location: user.location ?? '',
        gender: user.gender ?? '',
        jobTitle: user.jobTitle ?? '',
        company: user.company ?? '',
        yearsOfExperience: user.yearsOfExperience ?? '',
        bio: user.bio ?? '',
        linkedin: user.linkedin ?? user.portfolioUrl ?? '',
      });
      this.skills = [...(user.skills ?? [])];
      this.tools = [...(user.tools ?? [])];
      this.cdr.markForCheck();
    });
  }

  displayInitials(): string {
    const f = String(this.profileForm.get('firstName')?.value ?? '').trim();
    const l = String(this.profileForm.get('lastName')?.value ?? '').trim();
    const a = (f[0] ?? '') + (l[0] ?? '');
    return a ? a.toUpperCase() : 'M';
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
    this.auth.updateProfile({
      firstName: first,
      lastName: last,
      name: `${first} ${last}`.trim(),
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
      this.toast.error('Please complete your background information.');
      this.cdr.markForCheck();
      return;
    }
    const v = this.profileForm.getRawValue();
    this.auth.updateProfile({
      jobTitle: String(v.jobTitle ?? '').trim() || undefined,
      company: String(v.company ?? '').trim() || undefined,
      yearsOfExperience: String(v.yearsOfExperience ?? '').trim() || undefined,
    });
    this.toast.success('Background information saved.');
    this.cdr.markForCheck();
  }

  onSaveBiographyExpertise(): void {
    this.errors = {};
    if (!this.validateBiographyExpertise()) {
      this.toast.error('Please complete your bio and add at least one skill.');
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
    this.toast.success('About you and skills saved.');
    this.cdr.markForCheck();
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
}
