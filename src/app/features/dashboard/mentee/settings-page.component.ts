import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ToastService } from '../../../shared/services/toast.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Observable, take } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectAuthUser, selectAuthUserId } from '../../auth/store/auth.selectors';
import { updateProfile } from '../../auth/store/auth.actions';
import type { User } from '../../../core/models/user.model';
import { AuthApiService } from '../../../core/services/auth-api.service';

@Component({
  selector: 'mc-mentee-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">Settings</h1>
        <p class="text-muted-foreground mt-1">Manage your account preferences</p>
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
          <div class="mt-2 flex justify-end">
            <button type="button" (click)="onSavePersonal()"
              class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Save Changes
            </button>
          </div>
        </div>

        <!-- Background -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-5">Background</h2>
          <div class="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Current Role</label>
              <input type="text" [(ngModel)]="form.jobTitle" placeholder="Student / Junior Developer"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Organization / University</label>
              <input type="text" [(ngModel)]="form.company" placeholder="University / Company"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Years in Field</label>
              <input type="number" min="0" [(ngModel)]="form.yearsOfExperience" placeholder="0"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button type="button" (click)="onSaveBackground()"
              class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Save Changes
            </button>
          </div>
        </div>

        <!-- About & Skills -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 class="text-lg text-foreground font-medium mb-5">About &amp; Skills</h2>
          <div class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">About Me</label>
              <textarea [(ngModel)]="form.bio" rows="5"
                placeholder="Tell us about yourself and your goals..."
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md resize-none"></textarea>
            </div>

            <!-- Skills -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Skills &amp; Interests</label>
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
              <label class="block text-sm font-medium text-foreground mb-1.5">Tools &amp; Technologies <span class="text-muted-foreground font-normal">(Optional)</span></label>
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
                <label class="block text-sm font-medium text-foreground mb-1.5">Portfolio / Website <span class="text-muted-foreground font-normal">(Optional)</span></label>
                <input type="url" [(ngModel)]="form.portfolioUrl" placeholder="https://yourportfolio.com"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">LinkedIn <span class="text-muted-foreground font-normal">(Optional)</span></label>
                <input type="url" [(ngModel)]="form.linkedin" placeholder="https://linkedin.com/in/username"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <button type="button" (click)="onSaveAbout()"
              class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Save Changes
            </button>
          </div>
        </div>

      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenteeSettingsPageComponent implements OnInit {
  private readonly store = inject(Store<AppState>);
  private readonly toast = inject(ToastService);
  private readonly authApi = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly user$: Observable<User | null> = this.store.select(selectAuthUser);

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
  };

  skillInput = '';
  toolInput = '';
  avatarPreview: string | null = null;
  avatarError = '';
  avatarUploading = false;
  private currentUserId: string | null = null;


  ngOnInit(): void {
    this.store.select(selectAuthUser).pipe(take(1)).subscribe((user) => {
      if (!user) return;
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
      };
      this.cdr.markForCheck();
    });
  }

  addSkill(event: Event): void {
    event.preventDefault();
    const value = this.skillInput.trim();
    if (value && !this.form.skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      this.form.skills = [...this.form.skills, value];
    }
    this.skillInput = '';
  }

  removeSkill(skill: string): void {
    this.form.skills = this.form.skills.filter((s) => s !== skill);
  }

  addTool(event: Event): void {
    event.preventDefault();
    const value = this.toolInput.trim();
    if (value && !this.form.tools.some((t) => t.toLowerCase() === value.toLowerCase())) {
      this.form.tools = [...this.form.tools, value];
    }
    this.toolInput = '';
  }

  removeTool(tool: string): void {
    this.form.tools = this.form.tools.filter((t) => t !== tool);
  }

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

  onSavePersonal(): void {
    this.store.dispatch(updateProfile({
      updates: { name: this.form.name, phone: this.form.phone, location: this.form.location, gender: this.form.gender },
    }));
    this.toast.success('Personal information updated.');
  }

  onSaveBackground(): void {
    this.store.dispatch(updateProfile({
      updates: { jobTitle: this.form.jobTitle, company: this.form.company, yearsOfExperience: this.form.yearsOfExperience },
    }));
    this.toast.success('Background updated.');
  }

  onSaveAbout(): void {
    this.store.dispatch(updateProfile({
      updates: { bio: this.form.bio, skills: this.form.skills, tools: this.form.tools, portfolioUrl: this.form.portfolioUrl, linkedin: this.form.linkedin },
    }));
    this.toast.success('About & skills updated.');
  }

  isAvatarUrl(avatar: string | undefined): boolean {
    return !!avatar && (avatar.startsWith('http') || avatar.startsWith('/'));
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

}
