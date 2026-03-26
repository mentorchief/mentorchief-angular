import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { selectPlatformConfig } from '../../../store/platform/platform.selectors';
import { updatePlatformConfig } from '../../../store/platform/platform.actions';

@Component({
  selector: 'mc-admin-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto p-6 lg:p-8">
      <header class="mb-10">
        <h1 class="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight">Admin Settings</h1>
        <p class="text-muted-foreground mt-1.5 text-sm">Configure platform settings, billing, limits, and content.</p>
      </header>

      <!-- Section 1: General -->
      <section class="mb-10">
        <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5">General</h2>
        <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div class="p-6 lg:p-8 space-y-6">
            <div class="grid sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="platform-name" class="block text-sm font-medium text-foreground">Platform Name</label>
                <input
                  id="platform-name"
                  type="text"
                  [(ngModel)]="platformName"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div class="space-y-2">
                <label for="currency" class="block text-sm font-medium text-foreground">Currency</label>
                <input
                  id="currency"
                  type="text"
                  [(ngModel)]="currency"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div class="space-y-2">
              <label for="tagline" class="block text-sm font-medium text-foreground">Tagline</label>
              <input
                id="tagline"
                type="text"
                [(ngModel)]="tagline"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div class="space-y-2">
              <label for="admin-whatsapp" class="block text-sm font-medium text-foreground">Admin WhatsApp Number</label>
              <input
                id="admin-whatsapp"
                type="text"
                [(ngModel)]="adminWhatsapp"
                placeholder="e.g. +1234567890"
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p class="text-xs text-muted-foreground">Country code + number format</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Financial -->
      <section class="mb-10">
        <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5">Financial</h2>
        <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div class="p-6 lg:p-8 space-y-6">
            <div class="grid sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="platform-fee" class="block text-sm font-medium text-foreground">Platform fee (%)</label>
                <input
                  id="platform-fee"
                  type="number"
                  [(ngModel)]="platformFee"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div class="space-y-2">
                <label for="escrow-days" class="block text-sm font-medium text-foreground">Escrow hold days</label>
                <input
                  id="escrow-days"
                  type="number"
                  [(ngModel)]="escrowDays"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div class="grid sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="min-price" class="block text-sm font-medium text-foreground">Min subscription price</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    id="min-price"
                    type="number"
                    [(ngModel)]="minPrice"
                    class="w-full pl-8 pr-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              <div class="space-y-2">
                <label for="max-price" class="block text-sm font-medium text-foreground">Max subscription price</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    id="max-price"
                    type="number"
                    [(ngModel)]="maxPrice"
                    class="w-full pl-8 pr-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <div class="grid sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="refund-window" class="block text-sm font-medium text-foreground">Refund window (days)</label>
                <input
                  id="refund-window"
                  type="number"
                  [(ngModel)]="refundWindowDays"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: Limits -->
      <section class="mb-10">
        <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5">Limits</h2>
        <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div class="p-6 lg:p-8 space-y-6">
            <div class="grid sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="mentor-capacity" class="block text-sm font-medium text-foreground">Mentor capacity limit</label>
                <input
                  id="mentor-capacity"
                  type="number"
                  [(ngModel)]="mentorCapacityLimit"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div class="space-y-2">
                <label for="payment-timeout" class="block text-sm font-medium text-foreground">Payment timeout (hours)</label>
                <input
                  id="payment-timeout"
                  type="number"
                  [(ngModel)]="paymentTimeoutHours"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div class="grid sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="request-expiry" class="block text-sm font-medium text-foreground">Request expiry (days)</label>
                <input
                  id="request-expiry"
                  type="number"
                  [(ngModel)]="requestExpiryDays"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div class="space-y-2">
                <label for="report-deadline" class="block text-sm font-medium text-foreground">Report deadline (days)</label>
                <input
                  id="report-deadline"
                  type="number"
                  [(ngModel)]="reportDeadlineDays"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div class="grid sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="report-reminder" class="block text-sm font-medium text-foreground">Report reminder (days)</label>
                <input
                  id="report-reminder"
                  type="number"
                  [(ngModel)]="reportReminderDays"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div class="space-y-2">
                <label for="max-attachment" class="block text-sm font-medium text-foreground">Max attachment size (MB)</label>
                <input
                  id="max-attachment"
                  type="number"
                  [(ngModel)]="maxAttachmentSizeMb"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: Security -->
      <section class="mb-10">
        <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5">Security</h2>
        <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div class="p-6 lg:p-8 space-y-6">
            <div class="grid sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="reset-expiry" class="block text-sm font-medium text-foreground">Reset link expiry (minutes)</label>
                <input
                  id="reset-expiry"
                  type="number"
                  [(ngModel)]="resetLinkExpiryMinutes"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div class="space-y-2">
                <label for="reset-cooldown" class="block text-sm font-medium text-foreground">Reset link cooldown (minutes)</label>
                <input
                  id="reset-cooldown"
                  type="number"
                  [(ngModel)]="resetLinkCooldownMinutes"
                  class="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 5: Expertise Categories -->
      <section class="mb-10">
        <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5">Content</h2>
        <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div class="p-6 lg:p-8">
            <h3 class="text-sm font-medium text-foreground mb-4">Expertise Categories</h3>
            @if (categoriesLoading) {
              <p class="text-sm text-muted-foreground">Loading categories...</p>
            } @else {
              @if (categories.length > 0) {
                <div class="flex flex-wrap gap-2 mb-5">
                  @for (cat of categories; track cat.id) {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm text-foreground">
                      {{ cat.name }}
                      <button
                        type="button"
                        (click)="deleteCategory(cat)"
                        class="text-muted-foreground hover:text-destructive transition-colors ml-1"
                        title="Remove category"
                      >
                        &times;
                      </button>
                    </span>
                  }
                </div>
              } @else {
                <p class="text-sm text-muted-foreground mb-5">No categories defined yet.</p>
              }
              <div class="flex gap-3">
                <input
                  type="text"
                  [(ngModel)]="newCategoryName"
                  placeholder="New category name"
                  (keydown.enter)="addCategory()"
                  class="flex-1 px-4 py-2.5 bg-input-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="button"
                  (click)="addCategory()"
                  [disabled]="!newCategoryName.trim()"
                  class="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            }

            <!-- Price Range Filters -->
            <div class="mt-8 pt-6 border-t border-border">
              <h3 class="text-sm font-medium text-foreground mb-4">Price Range Filters</h3>
              <p class="text-xs text-muted-foreground mb-4">These ranges appear as filter options on the Browse Mentors page.</p>
              @if (priceRanges.length > 0) {
                <div class="flex flex-wrap gap-2 mb-5">
                  @for (range of priceRanges; track range.label) {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm text-foreground">
                      {{ range.label }}
                      <button
                        type="button"
                        (click)="deletePriceRange(range)"
                        class="text-muted-foreground hover:text-destructive transition-colors ml-1"
                        title="Remove range"
                      >
                        &times;
                      </button>
                    </span>
                  }
                </div>
              } @else {
                <p class="text-sm text-muted-foreground mb-5">No price ranges defined. Default ranges will be used.</p>
              }
              <div class="flex gap-3 items-end">
                <div class="space-y-1">
                  <label class="text-xs text-muted-foreground">Min ($)</label>
                  <input
                    type="number"
                    [(ngModel)]="newRangeMin"
                    placeholder="0"
                    class="w-24 px-3 py-2.5 bg-input-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-muted-foreground">Max ($, 0 = no limit)</label>
                  <input
                    type="number"
                    [(ngModel)]="newRangeMax"
                    placeholder="100"
                    class="w-24 px-3 py-2.5 bg-input-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <button
                  type="button"
                  (click)="addPriceRange()"
                  [disabled]="newRangeMin == null && newRangeMax == null"
                  class="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Save All Settings Button -->
      <section class="mb-10">
        <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div class="px-6 lg:px-8 py-4 bg-muted/30 flex justify-end">
            <button
              (click)="onSaveSettings()"
              [disabled]="saving"
              class="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : 'Save changes' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Section 6: Danger Zone -->
      <section>
        <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5">Danger zone</h2>
        <div class="bg-card rounded-xl border border-destructive/20 overflow-hidden">
          <div class="p-6 lg:p-8">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-destructive/5 border border-destructive/10">
              <div>
                <p class="font-medium text-foreground">Maintenance mode</p>
                <p class="text-muted-foreground text-sm mt-0.5">
                  {{ maintenanceMode ? 'Platform is currently in maintenance mode. Non-admin users cannot access.' : 'Disable platform access for all non-admin users.' }}
                </p>
              </div>
              <button
                (click)="onToggleMaintenanceMode()"
                [class]="maintenanceMode ? 'border-green-600 text-green-600 hover:bg-green-50' : 'border-destructive text-destructive hover:bg-destructive/10'"
                class="shrink-0 px-4 py-2.5 border text-sm font-medium rounded-lg transition-colors"
              >
                {{ maintenanceMode ? 'Disable maintenance mode' : 'Enable maintenance mode' }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSettingsPageComponent implements OnInit {
  private readonly store = inject(Store<AppState>);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly authApi = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  // General
  platformName = 'MentorChief';
  tagline = '';
  adminWhatsapp = '';
  currency = 'USD';

  // Financial
  platformFee = 10;
  escrowDays = 30;
  minPrice = 50;
  maxPrice = 1000;
  refundWindowDays = 3;

  // Limits
  mentorCapacityLimit = 5;
  paymentTimeoutHours = 24;
  requestExpiryDays = 5;
  reportDeadlineDays = 7;
  reportReminderDays = 3;
  maxAttachmentSizeMb = 30;

  // Security
  resetLinkExpiryMinutes = 10;
  resetLinkCooldownMinutes = 2;

  // Danger
  maintenanceMode = false;

  // Categories
  categories: { id: string; name: string }[] = [];
  categoriesLoading = true;
  newCategoryName = '';

  // Price Range Filters
  priceRanges: { min: number; max: number; label: string }[] = [];
  newRangeMin: number | null = null;
  newRangeMax: number | null = null;

  saving = false;

  ngOnInit(): void {
    // Load full config from DB
    this.authApi.getFullPlatformConfig().subscribe({
      next: (raw) => {
        if (raw) {
          this.mapFromDb(raw);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        // Fall back to store values
        this.store.select(selectPlatformConfig).pipe(take(1)).subscribe((config) => {
          this.platformName = config.platformName ?? 'MentorChief';
          this.tagline = config.tagline ?? '';
          this.adminWhatsapp = config.adminWhatsapp ?? '';
          this.currency = config.currency ?? 'USD';
          this.platformFee = config.platformFeePercent ?? 10;
          this.escrowDays = config.escrowDays ?? 30;
          this.minPrice = config.minSubscriptionPrice ?? 50;
          this.maxPrice = config.maxSubscriptionPrice ?? 1000;
          this.refundWindowDays = config.refundWindowDays ?? 3;
          this.mentorCapacityLimit = config.mentorCapacityLimit ?? 5;
          this.paymentTimeoutHours = config.paymentTimeoutHours ?? 24;
          this.requestExpiryDays = config.requestExpiryDays ?? 5;
          this.reportDeadlineDays = config.reportDeadlineDays ?? 7;
          this.reportReminderDays = config.reportReminderDays ?? 3;
          this.maxAttachmentSizeMb = config.maxAttachmentSizeMb ?? 30;
          this.resetLinkExpiryMinutes = config.resetLinkExpiryMinutes ?? 10;
          this.resetLinkCooldownMinutes = config.resetLinkCooldownMinutes ?? 2;
          this.maintenanceMode = config.maintenanceMode ?? false;
          this.cdr.markForCheck();
        });
      },
    });

    // Load expertise categories
    this.authApi.getExpertiseCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        this.categoriesLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.categoriesLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private mapFromDb(raw: Record<string, unknown>): void {
    this.platformName = (raw['platform_name'] as string) ?? 'MentorChief';
    this.tagline = (raw['tagline'] as string) ?? '';
    this.adminWhatsapp = (raw['admin_whatsapp'] as string) ?? '';
    this.currency = (raw['currency'] as string) ?? 'USD';
    this.platformFee = (raw['platform_fee_percent'] as number) ?? 10;
    this.escrowDays = (raw['escrow_days'] as number) ?? 30;
    this.minPrice = (raw['min_subscription_price'] as number) ?? 50;
    this.maxPrice = (raw['max_subscription_price'] as number) ?? 1000;
    this.refundWindowDays = (raw['refund_window_days'] as number) ?? 3;
    this.mentorCapacityLimit = (raw['mentor_capacity_limit'] as number) ?? 5;
    this.paymentTimeoutHours = (raw['payment_timeout_hours'] as number) ?? 24;
    this.requestExpiryDays = (raw['request_expiry_days'] as number) ?? 5;
    this.reportDeadlineDays = (raw['report_deadline_days'] as number) ?? 7;
    this.reportReminderDays = (raw['report_reminder_days'] as number) ?? 3;
    this.maxAttachmentSizeMb = (raw['max_attachment_size_mb'] as number) ?? 30;
    this.resetLinkExpiryMinutes = (raw['reset_link_expiry_min'] as number) ?? 10;
    this.resetLinkCooldownMinutes = (raw['reset_link_cooldown_min'] as number) ?? 2;
    this.maintenanceMode = (raw['maintenance_mode'] as boolean) ?? false;
    const ranges = raw['price_range_filters'] as { min: number; max: number; label: string }[] | null;
    this.priceRanges = Array.isArray(ranges) ? ranges : [];
  }

  private buildDbPayload(): Record<string, unknown> {
    return {
      platform_name: this.platformName,
      tagline: this.tagline,
      admin_whatsapp: this.adminWhatsapp,
      currency: this.currency,
      platform_fee_percent: this.platformFee,
      escrow_days: this.escrowDays,
      min_subscription_price: this.minPrice,
      max_subscription_price: this.maxPrice,
      refund_window_days: this.refundWindowDays,
      mentor_capacity_limit: this.mentorCapacityLimit,
      payment_timeout_hours: this.paymentTimeoutHours,
      request_expiry_days: this.requestExpiryDays,
      report_deadline_days: this.reportDeadlineDays,
      report_reminder_days: this.reportReminderDays,
      max_attachment_size_mb: this.maxAttachmentSizeMb,
      reset_link_expiry_min: this.resetLinkExpiryMinutes,
      reset_link_cooldown_min: this.resetLinkCooldownMinutes,
      maintenance_mode: this.maintenanceMode,
      price_range_filters: this.priceRanges,
    };
  }

  private buildStoreConfig(): Record<string, unknown> {
    return {
      platformName: this.platformName,
      tagline: this.tagline,
      adminWhatsapp: this.adminWhatsapp,
      currency: this.currency,
      platformFeePercent: this.platformFee,
      escrowDays: this.escrowDays,
      minSubscriptionPrice: this.minPrice,
      maxSubscriptionPrice: this.maxPrice,
      refundWindowDays: this.refundWindowDays,
      mentorCapacityLimit: this.mentorCapacityLimit,
      paymentTimeoutHours: this.paymentTimeoutHours,
      requestExpiryDays: this.requestExpiryDays,
      reportDeadlineDays: this.reportDeadlineDays,
      reportReminderDays: this.reportReminderDays,
      maxAttachmentSizeMb: this.maxAttachmentSizeMb,
      resetLinkExpiryMinutes: this.resetLinkExpiryMinutes,
      resetLinkCooldownMinutes: this.resetLinkCooldownMinutes,
      maintenanceMode: this.maintenanceMode,
      priceRangeFilters: this.priceRanges,
    };
  }

  onSaveSettings(): void {
    this.saving = true;
    this.cdr.markForCheck();
    this.authApi.saveFullPlatformConfig(this.buildDbPayload()).subscribe({
      next: () => {
        this.store.dispatch(updatePlatformConfig({ config: this.buildStoreConfig() }));
        this.toast.success('Platform settings saved successfully.');
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to save settings. Please try again.');
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }

  addCategory(): void {
    const name = this.newCategoryName.trim();
    if (!name) return;
    this.authApi.createExpertiseCategory(name).subscribe({
      next: (cat) => {
        this.categories = [...this.categories, cat];
        this.newCategoryName = '';
        this.toast.success(`Category "${cat.name}" added.`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to add category. Please try again.');
      },
    });
  }

  async deleteCategory(cat: { id: string; name: string }): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete the "${cat.name}" category? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.authApi.deleteExpertiseCategory(cat.id).subscribe({
      next: () => {
        this.categories = this.categories.filter((c) => c.id !== cat.id);
        this.toast.success(`Category "${cat.name}" deleted.`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to delete category. Please try again.');
      },
    });
  }

  addPriceRange(): void {
    const min = this.newRangeMin ?? 0;
    const max = this.newRangeMax ?? 0;
    const label = max > 0 ? `$${min} – $${max}` : `$${min}+`;
    this.priceRanges = [...this.priceRanges, { min, max, label }];
    this.newRangeMin = null;
    this.newRangeMax = null;
    this.cdr.markForCheck();
  }

  deletePriceRange(range: { min: number; max: number; label: string }): void {
    this.priceRanges = this.priceRanges.filter((r) => r.label !== range.label);
    this.cdr.markForCheck();
  }

  async onToggleMaintenanceMode(): Promise<void> {
    const enabling = !this.maintenanceMode;
    const confirmed = await this.confirmDialog.confirm({
      title: enabling ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode',
      message: enabling
        ? 'This will disable platform access for all non-admin users. Are you sure?'
        : 'This will restore platform access for all users. Are you sure?',
      confirmLabel: enabling ? 'Enable' : 'Disable',
      cancelLabel: 'Cancel',
      variant: enabling ? 'danger' : 'primary',
    });
    if (!confirmed) return;
    this.authApi.saveFullPlatformConfig({ maintenance_mode: enabling }).subscribe({
      next: () => {
        this.maintenanceMode = enabling;
        this.store.dispatch(updatePlatformConfig({ config: { maintenanceMode: enabling } }));
        this.toast.success(enabling ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.');
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to update maintenance mode. Please try again.');
      },
    });
  }
}
