import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast.service';
import type { AppState } from '../../../store/app.state';
import { selectAdminPayments } from '../store/dashboard.selectors';
import { releasePayment } from '../../../store/admin/admin.actions';
import { AuthApiService } from '../../../core/services/auth-api.service';
import type { AdminPayment } from '../../../core/models/dashboard.model';
import { selectMenteeReports } from '../../../store/reports';

const PAGE_SIZE = 10;

@Component({
  selector: 'mc-admin-payments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">Payments</h1>
        <p class="text-muted-foreground mt-1">Monitor and release platform transactions</p>
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
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (payment of paginatedPayments; track payment.id) {
                <tr class="border-b border-border last:border-0 hover:bg-muted/30">
                  <td class="px-5 py-4 text-sm text-muted-foreground font-mono">#{{ payment.id.slice(0,8) }}</td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ payment.date }}</td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ payment.mentee }}</td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ payment.mentor }}</td>
                  <td class="px-5 py-4 text-sm text-foreground font-medium">\${{ payment.amount }}</td>
                  <td class="px-5 py-4">
                    <span [class]="getStatusClass(payment.status)" class="px-2.5 py-1 rounded-md text-xs">
                      {{ getStatusLabel(payment.status) }}
                    </span>
                  </td>
                  <td class="px-5 py-4">
                    @if (payment.status === 'in_escrow' && hasReport(payment)) {
                      <button
                        (click)="onReleasePayment(payment)"
                        [disabled]="releasingId === payment.id"
                        class="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {{ releasingId === payment.id ? 'Releasing…' : 'Release' }}
                      </button>
                    } @else if (payment.status === 'in_escrow') {
                      <span class="text-xs text-muted-foreground" title="No report submitted yet">No report yet</span>
                    } @else {
                      <span class="text-xs text-muted-foreground">—</span>
                    }
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
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly authApi = inject(AuthApiService);
  private readonly destroy$ = new Subject<void>();

  paymentsList: AdminPayment[] = [];
  /** mentee_reports mentorId+menteeId pairs for gating release button */
  reportedPairs = new Set<string>();
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;
  searchQuery = '';
  filterStatus = '';
  releasingId: string | null = null;

  ngOnInit(): void {
    this.store.select(selectAdminPayments).pipe(takeUntil(this.destroy$)).subscribe((list) => {
      this.paymentsList = list;
      this.cdr.markForCheck();
    });
    this.store.select(selectMenteeReports).pipe(takeUntil(this.destroy$)).subscribe((reports) => {
      this.reportedPairs = new Set(reports.map((r) => `${r.mentorId}:${r.menteeId}`));
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hasReport(payment: AdminPayment): boolean {
    if (!payment.mentorId || !payment.menteeId) return false;
    return this.reportedPairs.has(`${payment.mentorId}:${payment.menteeId}`);
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

  async onReleasePayment(payment: AdminPayment): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Release Payment',
      message: `Release $${payment.amount} to ${payment.mentor}? Manually transfer the funds first, then confirm here.`,
      confirmLabel: 'Yes, Release',
      cancelLabel: 'Cancel',
      variant: 'primary',
    });
    if (!confirmed) return;

    this.releasingId = payment.id;
    this.cdr.markForCheck();

    this.authApi.releasePayment(payment.id).subscribe({
      next: () => {
        this.store.dispatch(releasePayment({ paymentId: payment.id }));
        // Notify mentor
        if (payment.mentorId) {
          this.authApi.createNotification({
            userId: payment.mentorId,
            type: 'payment_released',
            title: 'Payment released',
            body: `Your payment of $${payment.amount} has been released by the admin.`,
            metadata: { paymentId: payment.id },
          }).subscribe();
        }
        this.toast.success(`Payment of $${payment.amount} released to ${payment.mentor}.`);
        this.releasingId = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to release payment. Please try again.');
        this.releasingId = null;
        this.cdr.markForCheck();
      },
    });
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
      case 'completed': return 'Released';
      case 'in_escrow': return 'In Escrow';
      case 'disputed': return 'Disputed';
      case 'refunded': return 'Refunded';
    }
  }
}
