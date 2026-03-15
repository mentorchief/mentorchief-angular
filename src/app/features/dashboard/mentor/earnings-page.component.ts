import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { ToastService } from '../../../shared/services/toast.service';
import type { AppState } from '../../../store/app.state';
import { selectMentorEarningsForDisplay, selectMentorActiveMentees } from '../store/dashboard.selectors';

type EarningRow = { id: string; date: string; mentee: string; amount: number; status: 'paid' | 'in_escrow' | 'pending'; period: string };

const PAGE_SIZE = 10;

@Component({
  selector: 'mc-mentor-earnings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">Earnings</h1>
        <p class="text-muted-foreground mt-1">Track your income and payment history</p>
      </div>

      <!-- Summary Cards -->
      <div class="grid sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center">
              <fa-icon [icon]="['fas', 'wallet']" class="text-green-600 w-5 h-5" />
            </div>
            <span class="text-muted-foreground text-sm">Total Earned</span>
          </div>
          <p class="text-2xl text-foreground font-semibold">\${{ totalEarned }}</p>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-amber-100 rounded-md flex items-center justify-center">
              <fa-icon [icon]="['fas', 'lock']" class="text-amber-600 w-5 h-5" />
            </div>
            <span class="text-muted-foreground text-sm">In Escrow</span>
          </div>
          <p class="text-2xl text-foreground font-semibold">\${{ inEscrow }}</p>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
              <fa-icon [icon]="['fas', 'calendar']" class="text-blue-600 w-5 h-5" />
            </div>
            <span class="text-muted-foreground text-sm">This Month</span>
          </div>
          <p class="text-2xl text-foreground font-semibold">\${{ thisMonth }}</p>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-purple-100 rounded-md flex items-center justify-center">
              <fa-icon [icon]="['fas', 'users']" class="text-purple-600 w-5 h-5" />
            </div>
            <span class="text-muted-foreground text-sm">Active Mentees</span>
          </div>
          <p class="text-2xl text-foreground font-semibold">{{ activeMenteesCount }}</p>
        </div>
      </div>

      <!-- Pending Payouts -->
      <div class="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 bg-amber-100 rounded-md flex items-center justify-center shrink-0">
            <fa-icon [icon]="['fas', 'clock']" class="text-amber-600 w-5 h-5" />
          </div>
          <div class="flex-1">
            <h3 class="text-amber-900 font-medium">Pending Payout</h3>
            <p class="text-amber-700 text-sm mt-1">
              \${{ inEscrow }} will be released to your account when current mentorship periods complete.
            </p>
          </div>
          <button type="button" (click)="onViewDetails()" class="px-4 py-2 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700">
            View Details
          </button>
        </div>
      </div>

      <!-- Earnings History -->
      <div class="bg-card rounded-lg border border-border overflow-hidden">
        <div class="p-5 border-b border-border flex flex-wrap items-center justify-between gap-4">
          <h2 class="text-lg text-foreground font-medium">Earnings History</h2>
          <div class="flex flex-wrap items-center gap-3">
            <input
              type="text"
              [ngModel]="searchQuery"
              (ngModelChange)="onSearchQueryChange($event)"
              placeholder="Search by mentee, period..."
              class="min-w-[180px] px-4 py-2 bg-input-background border border-border rounded-md text-sm"
            />
            <select
              [ngModel]="filterStatus"
              (ngModelChange)="onFilterStatusChange($event)"
              class="px-4 py-2 bg-input-background border border-border rounded-md text-sm"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="in_escrow">In Escrow</option>
              <option value="pending">Pending</option>
            </select>
            <button type="button" (click)="onExportCsv()" class="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-muted">
              Export CSV
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Date</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentee</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Period</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Amount</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (earning of paginatedEarnings; track earning.id) {
                <tr class="border-b border-border last:border-0 hover:bg-muted/30">
                  <td class="px-5 py-4 text-sm text-foreground">{{ earning.date }}</td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ earning.mentee }}</td>
                  <td class="px-5 py-4 text-sm text-muted-foreground">{{ earning.period }}</td>
                  <td class="px-5 py-4 text-sm text-foreground font-medium">\${{ earning.amount }}</td>
                  <td class="px-5 py-4">
                    <span [class]="getStatusClass(earning.status)" class="px-2.5 py-1 rounded-md text-xs">
                      {{ getStatusLabel(earning.status) }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="p-4">
          <mc-pagination
            [totalItems]="filteredEarnings.length"
            [pageSize]="pageSize"
            [currentPage]="currentPage"
            (pageChange)="onPageChange($event)"
          />
        </div>
      </div>

      <!-- Payout Settings -->
      <div class="mt-8 bg-card rounded-lg border border-border p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg text-foreground font-medium">Payout Account</h2>
          <button type="button" (click)="onUpdatePayout()" class="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-muted">
            Update
          </button>
        </div>
        <div class="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div class="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span class="text-white text-xs font-bold">BANK</span>
          </div>
          <div class="flex-1">
            <p class="text-foreground text-sm font-medium">Chase Bank •••• 8842</p>
            <p class="text-muted-foreground text-xs">Checking Account</p>
          </div>
          <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Verified</span>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorEarningsPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  earningsList: EarningRow[] = [];
  activeMenteesCount = 0;
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;
  searchQuery = '';
  filterStatus = '';

  ngOnInit(): void {
    this.store
      .select(selectMentorEarningsForDisplay)
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
        this.earningsList = list;
        this.cdr.markForCheck();
      });
    this.store
      .select(selectMentorActiveMentees)
      .pipe(takeUntil(this.destroy$))
      .subscribe((mentees) => {
        this.activeMenteesCount = mentees.length;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredEarnings(): EarningRow[] {
    const q = this.searchQuery.toLowerCase().trim();
    const status = this.filterStatus;
    return this.earningsList.filter((e) => {
      const matchSearch = !q || e.mentee.toLowerCase().includes(q) || e.period.toLowerCase().includes(q);
      const matchStatus = !status || e.status === status;
      return matchSearch && matchStatus;
    });
  }

  get paginatedEarnings(): EarningRow[] {
    const list = this.filteredEarnings;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  onFilterStatusChange(value: string): void {
    this.filterStatus = value;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.cdr.markForCheck();
  }

  get totalEarned(): number {
    return this.earningsList.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  }

  get inEscrow(): number {
    return this.earningsList.filter(e => e.status === 'in_escrow').reduce((sum, e) => sum + e.amount, 0);
  }

  get thisMonth(): number {
    return this.earningsList.filter(e => e.date.includes('Mar') || e.period.includes('Mar')).reduce((sum, e) => sum + e.amount, 0);
  }

  getStatusClass(status: EarningRow['status']): string {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'in_escrow': return 'bg-amber-100 text-amber-700';
      case 'pending': return 'bg-muted text-muted-foreground';
    }
  }

  getStatusLabel(status: EarningRow['status']): string {
    switch (status) {
      case 'paid': return 'Paid';
      case 'in_escrow': return 'In Escrow';
      case 'pending': return 'Pending';
    }
  }

  onViewDetails(): void {
    this.toast.info('Payout details coming soon.');
  }

  onExportCsv(): void {
    this.toast.info('CSV export coming soon.');
  }

  onUpdatePayout(): void {
    this.toast.info('Payout account update coming soon.');
  }
}
