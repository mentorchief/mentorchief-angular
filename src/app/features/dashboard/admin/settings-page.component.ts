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
        <p class="text-muted-foreground mt-1.5 text-sm">Configure platform billing and access.</p>
      </header>

      <!-- Platform Configuration -->
      <section class="mb-10">
        <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5">Platform configuration</h2>
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
                <label for="escrow-days" class="block text-sm font-medium text-foreground">Escrow period (days)</label>
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
                <label for="min-price" class="block text-sm font-medium text-foreground">Min. subscription price</label>
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
                <label for="max-price" class="block text-sm font-medium text-foreground">Max. subscription price</label>
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
          </div>
          <div class="px-6 lg:px-8 py-4 bg-muted/30 border-t border-border flex justify-end">
            <button
              (click)="onSaveSettings()"
              class="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Save changes
            </button>
          </div>
        </div>
      </section>

      <!-- Danger Zone -->
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

  platformFee = 10;
  escrowDays = 30;
  minPrice = 50;
  maxPrice = 1000;
  maintenanceMode = false;

  ngOnInit(): void {
    this.store.select(selectPlatformConfig).pipe(take(1)).subscribe((config) => {
      this.platformFee = config.platformFeePercent ?? 10;
      this.escrowDays = config.escrowDays ?? 30;
      this.minPrice = config.minSubscriptionPrice ?? 50;
      this.maxPrice = config.maxSubscriptionPrice ?? 1000;
      this.maintenanceMode = config.maintenanceMode ?? false;
      this.cdr.markForCheck();
    });
  }

  onSaveSettings(): void {
    const config = {
      platformFeePercent: this.platformFee,
      escrowDays: this.escrowDays,
      minSubscriptionPrice: this.minPrice,
      maxSubscriptionPrice: this.maxPrice,
    };
    this.authApi.savePlatformConfig(config).subscribe({
      next: () => {
        this.store.dispatch(updatePlatformConfig({ config }));
        this.toast.success('Platform settings saved successfully.');
      },
      error: () => {
        this.toast.error('Failed to save settings. Please try again.');
      },
    });
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
    this.authApi.savePlatformConfig({ maintenanceMode: enabling }).subscribe({
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
