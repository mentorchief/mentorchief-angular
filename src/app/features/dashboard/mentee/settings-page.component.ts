import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ToastService } from '../../../shared/services/toast.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { Observable } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectAuthUser } from '../../auth/store/auth.selectors';
import type { User } from '../../../core/models/user.model';

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
                  <input
                    type="text"
                    [value]="user.name"
                    class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    [value]="user.email"
                    disabled
                    class="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-muted-foreground"
                  />
                </div>
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                  <input
                    type="tel"
                    [value]="user.phone || ''"
                    placeholder="+1 (555) 000-0000"
                    class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5">Location</label>
                  <input
                    type="text"
                    [value]="user.location || ''"
                    placeholder="City, Country"
                    class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <button type="button" (click)="onSaveProfile()" class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Save Changes
            </button>
          </div>
        </div>

        <!-- Notifications -->
        <div class="bg-card rounded-lg border border-border p-6 mb-6">
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

        <!-- Security -->
        <div class="bg-card rounded-lg border border-border p-6">
          <h2 class="text-lg text-foreground font-medium mb-4">Security</h2>
          <div class="space-y-4">
            <button type="button" (click)="onChangePassword()" class="w-full flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left">
              <div>
                <p class="text-foreground text-sm font-medium">Change Password</p>
                <p class="text-muted-foreground text-xs">Update your password regularly for security</p>
              </div>
              <fa-icon [icon]="['fas', 'chevron-right']" class="text-muted-foreground w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-card rounded-lg border border-destructive/30 p-6">
          <h2 class="text-lg text-destructive font-medium mb-4">Danger Zone</h2>
          <div class="flex items-center justify-between p-4 bg-destructive/5 rounded-lg">
            <div>
              <p class="text-foreground text-sm font-medium">Delete Account</p>
              <p class="text-muted-foreground text-xs">Permanently delete your account and all data</p>
            </div>
            <button
              type="button"
              (click)="onDeleteAccount()"
              class="px-4 py-2 border border-destructive text-destructive rounded-md text-sm hover:bg-destructive/10"
            >
              Delete Account
            </button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenteeSettingsPageComponent {
  private readonly store = inject(Store<AppState>);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly user$: Observable<User | null> = this.store.select(selectAuthUser);

  notificationSettings = [
    { id: 'email', label: 'Email Notifications', description: 'Receive updates via email', enabled: true },
    { id: 'messages', label: 'Message Alerts', description: 'Get notified when mentors message you', enabled: true },
    { id: 'payments', label: 'Payment Updates', description: 'Notifications about payments and escrow', enabled: true },
    { id: 'marketing', label: 'Marketing Emails', description: 'Tips, features, and platform updates', enabled: false },
  ];

  toggleNotification(id: string): void {
    this.notificationSettings = this.notificationSettings.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s,
    );
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  onChangePassword(): void {
    this.toast.info('Password change coming soon.');
  }

  onSaveProfile(): void {
    this.toast.success('Profile updated successfully.');
  }

  async onDeleteAccount(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Account',
      message: 'Are you sure you want to delete your account? This action cannot be undone. All your data, mentorship history, and payment records will be permanently removed.',
      confirmLabel: 'Delete Account',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      this.toast.info('Account deletion has been requested. You will receive an email to confirm.');
    }
  }
}
