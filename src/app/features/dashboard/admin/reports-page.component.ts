import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { ToastService } from '../../../shared/services/toast.service';
import type { AppState } from '../../../store/app.state';
import {
  selectReportMetricsComputed,
  selectReportRevenueChart,
  selectReportUserGrowthChartComputed,
  selectReportTopMentors,
  selectReportRecentActivity,
} from '../store/dashboard.selectors';

@Component({
  selector: 'mc-admin-reports-page',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">Reports</h1>
        <p class="text-muted-foreground mt-1">Platform analytics and insights</p>
      </div>

      <!-- Date Range -->
      <div class="bg-card rounded-lg border border-border p-4 mb-8">
        <div class="flex items-center gap-4">
          <span class="text-muted-foreground text-sm">Date Range:</span>
          <select class="px-4 py-2 bg-input-background border border-border rounded-md">
            <option>Last 7 days</option>
            <option selected>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
          <button type="button" (click)="onExportReport()" class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 ml-auto">
            Export Report
          </button>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        @for (metric of (metrics$ | async) ?? []; track metric.label) {
          <div class="bg-card rounded-lg border border-border p-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-muted-foreground text-sm">{{ metric.label }}</span>
              <span [class]="metric.trend > 0 ? 'text-green-600' : 'text-destructive'" class="text-xs">
                {{ metric.trend > 0 ? '+' : '' }}{{ metric.trend }}%
              </span>
            </div>
            <div class="text-2xl text-foreground font-semibold">{{ metric.value }}</div>
          </div>
        }
      </div>

      <!-- Charts Section -->
      <div class="grid lg:grid-cols-2 gap-6 mb-8">
        <!-- Revenue Chart -->
        <div class="bg-card rounded-lg border border-border p-5">
          <h3 class="text-foreground font-medium mb-4">Revenue Over Time</h3>
          <div class="h-64 flex items-end gap-2">
            @if (revenueChart$ | async; as chart) {
              @for (bar of chart.data; track bar.month) {
                <div class="flex-1 flex flex-col items-center gap-2">
                  <div
                    class="w-full bg-primary/20 rounded-t"
                    [style.height.%]="chart.maxRevenue ? (bar.value / chart.maxRevenue) * 100 : 0"
                  >
                    <div
                      class="w-full bg-primary rounded-t"
                      [style.height.%]="chart.maxRevenue ? (bar.value / chart.maxRevenue) * 100 : 0"
                    ></div>
                  </div>
                  <span class="text-muted-foreground text-xs">{{ bar.month }}</span>
                </div>
              }
            }
          </div>
        </div>

        <!-- User Growth -->
        <div class="bg-card rounded-lg border border-border p-5">
          <h3 class="text-foreground font-medium mb-4">User Growth</h3>
          <div class="space-y-4">
            @if (userGrowthChart$ | async; as chart) {
              @for (stat of chart.data; track stat.label) {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-foreground text-sm">{{ stat.label }}</span>
                    <span class="text-foreground text-sm font-medium">{{ stat.count }}</span>
                  </div>
                  <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      [class]="stat.color"
                      class="h-full rounded-full"
                      [style.width.%]="chart.maxUsers ? (stat.count / chart.maxUsers) * 100 : 0"
                    ></div>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>

      <!-- Top Performers -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Top Mentors -->
        <div class="bg-card rounded-lg border border-border p-5">
          <h3 class="text-foreground font-medium mb-4">Top Mentors</h3>
          <div class="space-y-3">
            @for (mentor of (topMentors$ | async) ?? []; track mentor.name; let i = $index) {
              <div class="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <span class="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-medium">
                  {{ i + 1 }}
                </span>
                <div class="flex-1">
                  <p class="text-foreground text-sm font-medium">{{ mentor.name }}</p>
                  <p class="text-muted-foreground text-xs">{{ mentor.mentees }} mentees</p>
                </div>
                <span class="text-foreground text-sm font-medium">\${{ mentor.earnings }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-card rounded-lg border border-border p-5">
          <h3 class="text-foreground font-medium mb-4">Recent Activity</h3>
          <div class="space-y-3">
            @for (activity of (recentActivity$ | async) ?? []; track activity.id) {
              <div class="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                <div [class]="activity.iconBg" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  <fa-icon [icon]="activity.icon" class="w-4 h-4" />
                </div>
                <div class="flex-1">
                  <p class="text-foreground text-sm">{{ activity.text }}</p>
                  <p class="text-muted-foreground text-xs">{{ activity.time }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReportsPageComponent {
  private readonly store = inject(Store<AppState>);
  private readonly toast = inject(ToastService);
  readonly metrics$ = this.store.select(selectReportMetricsComputed);
  readonly revenueChart$ = this.store.select(selectReportRevenueChart);
  readonly userGrowthChart$ = this.store.select(selectReportUserGrowthChartComputed);
  readonly topMentors$ = this.store.select(selectReportTopMentors);
  readonly recentActivity$ = this.store.select(selectReportRecentActivity);

  onExportReport(): void {
    this.toast.info('Report export coming soon.');
  }
}
