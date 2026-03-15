import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { Observable, combineLatest, map } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectAuthUser } from '../../auth/store/auth.selectors';
import { selectMyMenteesActive, selectPlatformConfig } from '../store/dashboard.selectors';
import { DEFAULT_SAMPLE_PRICE, DEFAULT_MENTEE_CAPACITY } from '../../../core/constants';
import { parseMenteeCapacity } from '../../../core/utils/mentor.utils';
import { updateProfile } from '../../auth/store/auth.actions';
import type { User } from '../../../core/models/user.model';

@Component({
  selector: 'mc-mentor-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
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
                  <input type="text" [value]="user.name" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input type="email" [value]="user.email" disabled class="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-muted-foreground" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Professional Title</label>
                <input type="text" [value]="user.jobTitle || ''" placeholder="e.g., Senior Software Engineer" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md" />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Bio</label>
                <textarea rows="4" [value]="user.bio || ''" placeholder="Tell mentees about yourself..." class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md"></textarea>
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
                  <input type="number" [value]="user.subscriptionCost || (platformConfig$ | async)?.samplePrice ?? defaultSamplePrice" class="w-full pl-8 pr-4 py-2.5 bg-input-background border border-border rounded-md" />
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
              [class]="isAccepting ? 'bg-primary' : 'bg-muted'"
              class="relative w-11 h-6 rounded-full transition-colors inline-flex items-center"
              (click)="toggleAccepting()"
            >
              <span
                [class]="isAccepting ? 'translate-x-6' : 'translate-x-0.5'"
                class="absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform"
              ></span>
            </button>
          </div>
          <p class="text-muted-foreground text-sm">
            You have {{ ((spotsAvailable$ | async) ?? 0) }} spots available out of {{ (mentorCapacity$ | async) ?? defaultCapacity }} total capacity.
          </p>
        </div>

        <!-- Danger Zone -->
        <div class="bg-card rounded-lg border border-destructive/30 p-6 mb-6">
          <h2 class="text-lg text-destructive font-medium mb-4">Danger Zone</h2>
          <div class="flex items-center justify-between p-4 bg-destructive/5 rounded-lg">
            <div>
              <p class="text-foreground text-sm font-medium">Delete Account</p>
              <p class="text-muted-foreground text-xs">Permanently delete your mentor profile and all data</p>
            </div>
            <button type="button" (click)="onDeleteAccount()" class="px-4 py-2 border border-destructive text-destructive rounded-md text-sm hover:bg-destructive/10">
              Delete Account
            </button>
          </div>
        </div>

        <!-- Notifications -->
        <div class="bg-card rounded-lg border border-border p-6">
          <h2 class="text-lg text-foreground font-medium mb-4">Notifications</h2>
          <div class="space-y-4">
            @for (setting of notificationSettings; track setting.id) {
              <div class="flex items-center justify-between py-2">
                <div>
                  <p class="text-foreground text-sm font-medium">{{ setting.label }}</p>
                  <p class="text-muted-foreground text-xs">{{ setting.description }}</p>
                </div>
                <button
                  type="button"
                  (click)="toggleNotification(setting.id)"
                  [class]="setting.enabled ? 'bg-primary' : 'bg-muted'"
                  class="relative w-11 h-6 rounded-full transition-colors inline-flex items-center"
                >
                  <span
                    [class]="setting.enabled ? 'translate-x-6' : 'translate-x-0.5'"
                    class="absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  ></span>
                </button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorSettingsPageComponent {
  private readonly store = inject(Store<AppState>);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly user$: Observable<User | null> = this.store.select(selectAuthUser);
  readonly platformConfig$ = this.store.select(selectPlatformConfig);
  readonly defaultSamplePrice = DEFAULT_SAMPLE_PRICE;
  readonly defaultCapacity = DEFAULT_MENTEE_CAPACITY;
  readonly mentorCapacity$ = this.store.select(selectAuthUser).pipe(
    map((u) => parseMenteeCapacity(u?.menteeCapacity)),
  );
  readonly spotsAvailable$ = combineLatest([
    this.mentorCapacity$,
    this.store.select(selectMyMenteesActive),
  ]).pipe(map(([cap, active]) => Math.max(0, cap - active.length)));

  isAccepting = true;

  notificationSettings = [
    { id: 'requests', label: 'New Mentee Requests', description: 'Get notified when someone wants to join', enabled: true },
    { id: 'messages', label: 'Message Alerts', description: 'Notifications for new messages', enabled: true },
    { id: 'payments', label: 'Payment Updates', description: 'Escrow releases and earnings', enabled: true },
  ];

  toggleAccepting(): void {
    this.isAccepting = !this.isAccepting;
  }

  toggleNotification(id: string): void {
    this.notificationSettings = this.notificationSettings.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s,
    );
  }

  onMenteeCapacityChange(value: string): void {
    this.store.dispatch(updateProfile({ updates: { menteeCapacity: value } }));
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  onSaveProfile(): void {
    this.toast.success('Profile updated successfully.');
  }

  async onDeleteAccount(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Account',
      message: 'Are you sure you want to delete your mentor account? This will remove your profile, mentorship history, and all associated data. This action cannot be undone.',
      confirmLabel: 'Delete Account',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      this.toast.info('Account deletion has been requested. You will receive an email to confirm.');
    }
  }
}
