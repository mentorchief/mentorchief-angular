import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import type { AppState } from '../../../store/app.state';
import { selectAdminPayments } from '../store/dashboard.selectors';
import type { AdminPayment } from '../../../core/models/dashboard.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'mc-admin-payments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">Payments</h1>
        <p class="text-muted-foreground mt-1">Monitor platform transactions</p>
      </div>

      <!-- Summary Cards -->
      <div class="grid sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Total Volume</div>
          <div class="text-2xl text-foreground font-semibold">\${{ totalVolume.toLocaleString() }}</div>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">In Escrow</div>
          <div class="text-2xl text-foreground font-semibold">\${{ inEscrow.toLocaleString() }}</div>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Platform Fees</div>
          <div class="text-2xl text-foreground font-semibold">\${{ platformFees.toLocaleString() }}</div>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Disputes</div>
          <div class="text-2xl text-foreground font-semibold">{{ disputes }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-card rounded-lg border border-border p-4 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <input
            type="text"
            [ngModel]="searchQuery"
            (ngModelChange)="onSearchQueryChange($event)"
            placeholder="Search by ID, mentee, mentor..."
            class="flex-1 min-w-[200px] px-4 py-2 bg-input-background border border-border rounded-md"
          />
          <select
            [ngModel]="filterStatus"
            (ngModelChange)="onFilterStatusChange($event)"
            class="px-4 py-2 bg-input-background border border-border rounded-md"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_escrow">In Escrow</option>
            <option value="disputed">Disputed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <!-- Payments Table -->
      <div class="bg-card rounded-lg border border-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">ID</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Date</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentee</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentor</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Amount</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (payment of paginatedPayments; track payment.id) {
                <tr class="border-b border-border last:border-0 hover:bg-muted/30">
                  <td class="px-5 py-4 text-sm text-muted-foreground font-mono">#{{ payment.id }}</td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ payment.date }}</td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ payment.mentee }}</td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ payment.mentor }}</td>
                  <td class="px-5 py-4 text-sm text-foreground font-medium">\${{ payment.amount }}</td>
                  <td class="px-5 py-4">
                    <span [class]="getStatusClass(payment.status)" class="px-2.5 py-1 rounded-md text-xs">
                      {{ getStatusLabel(payment.status) }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="p-4">
          <mc-pagination
            [totalItems]="filteredPayments.length"
            [pageSize]="pageSize"
            [currentPage]="currentPage"
            (pageChange)="onPageChange($event)"
          />
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPaymentsPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  paymentsList: AdminPayment[] = [];
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;
  searchQuery = '';
  filterStatus = '';

  ngOnInit(): void {
    this.store
      .select(selectAdminPayments)
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
        this.paymentsList = list;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredPayments(): AdminPayment[] {
    const q = this.searchQuery.toLowerCase().trim();
    const status = this.filterStatus;
    return this.paymentsList.filter((p) => {
      const matchSearch = !q || p.id.toLowerCase().includes(q) || p.mentee.toLowerCase().includes(q) || p.mentor.toLowerCase().includes(q);
      const matchStatus = !status || p.status === status;
      return matchSearch && matchStatus;
    });
  }

  get paginatedPayments(): AdminPayment[] {
    const list = this.filteredPayments;
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

  get totalVolume(): number {
    return this.paymentsList.reduce((sum, p) => sum + p.amount, 0);
  }

  get inEscrow(): number {
    return this.paymentsList.filter(p => p.status === 'in_escrow').reduce((sum, p) => sum + p.amount, 0);
  }

  get platformFees(): number {
    return Math.round(this.totalVolume * 0.1);
  }

  get disputes(): number {
    return this.paymentsList.filter(p => p.status === 'disputed').length;
  }

  getStatusClass(status: AdminPayment['status']): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_escrow': return 'bg-amber-100 text-amber-700';
      case 'disputed': return 'bg-destructive/10 text-destructive';
      case 'refunded': return 'bg-muted text-muted-foreground';
    }
  }

  getStatusLabel(status: AdminPayment['status']): string {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_escrow': return 'In Escrow';
      case 'disputed': return 'Disputed';
      case 'refunded': return 'Refunded';
    }
  }
}
