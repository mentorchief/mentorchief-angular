import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { map } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { MenteeFacade } from '../../../core/facades/mentee.facade';
import { UserRole, ROLE_DISPLAY_LABELS } from '../../../core/models/user.model';

type PaymentRow = { id: string; date: string; mentor: string; amount: number; status: 'completed' | 'in_escrow' | 'refunded'; period: string };

const PAGE_SIZE = 10;

@Component({
  selector: 'mc-mentee-payments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">Payments</h1>
        <p class="text-muted-foreground mt-1">View your payment history and manage subscriptions</p>
      </div>

      <!-- Summary Cards -->
      <div class="grid sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
              <fa-icon [icon]="['fas', 'dollar-sign']" class="text-primary w-5 h-5" />
            </div>
            <span class="text-muted-foreground text-sm">Total Spent</span>
          </div>
          <p class="text-2xl text-foreground font-semibold">\${{ totalSpent }}</p>
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
            <div class="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center">
              <fa-icon [icon]="['fas', 'check']" class="text-green-600 w-5 h-5" />
            </div>
            <span class="text-muted-foreground text-sm">Completed</span>
          </div>
          <p class="text-2xl text-foreground font-semibold">\${{ completed }}</p>
        </div>
      </div>

      <!-- Payment History -->
      <div class="bg-card rounded-lg border border-border overflow-hidden">
        <div class="p-5 border-b border-border flex flex-wrap items-center justify-between gap-4">
          <h2 class="text-lg text-foreground font-medium">Payment History</h2>
          <div class="flex flex-wrap items-center gap-3">
            <input
              type="text"
              [ngModel]="searchQuery"
              (ngModelChange)="onSearchQueryChange($event)"
              placeholder="Search by mentor, period..."
              class="min-w-[180px] px-4 py-2 bg-input-background border border-border rounded-md text-sm"
            />
            <select
              [ngModel]="filterStatus"
              (ngModelChange)="onFilterStatusChange($event)"
              class="px-4 py-2 bg-input-background border border-border rounded-md text-sm"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_escrow">In Escrow</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Date</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentor</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Period</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Amount</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (payment of paginatedPayments; track payment.id) {
                <tr class="border-b border-border last:border-0 hover:bg-muted/30">
                  <td class="px-5 py-4 text-sm text-foreground">{{ payment.date }}</td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ payment.mentor }}</td>
                  <td class="px-5 py-4 text-sm text-muted-foreground">{{ payment.period }}</td>
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
export class MenteePaymentsPageComponent implements OnInit, OnDestroy {
  private readonly menteeData = inject(MenteeFacade);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  paymentsList: PaymentRow[] = [];
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;
  searchQuery = '';
  filterStatus = '';

  ngOnInit(): void {
    this.menteeData.data$.pipe(
      map((d) => {
        const mentorName = d.activeMentorship?.mentorName ?? ROLE_DISPLAY_LABELS[UserRole.Mentor];
        return d.payments.map((p) => ({
          id: p.id,
          date: p.releaseDate ?? p.month,
          mentor: mentorName,
          amount: p.amount,
          status: (p.status === 'released' ? 'completed' : p.status) as 'completed' | 'in_escrow' | 'refunded',
          period: p.month,
        }));
      }),
      takeUntil(this.destroy$),
    ).subscribe((list) => {
      this.paymentsList = list;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredPayments(): PaymentRow[] {
    const q = this.searchQuery.toLowerCase().trim();
    const status = this.filterStatus;
    return this.paymentsList.filter((p) => {
      const matchSearch = !q || p.mentor.toLowerCase().includes(q) || p.period.toLowerCase().includes(q);
      const matchStatus = !status || p.status === status;
      return matchSearch && matchStatus;
    });
  }

  get paginatedPayments(): PaymentRow[] {
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

  get totalSpent(): number {
    return this.paymentsList.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  }

  get inEscrow(): number {
    return this.paymentsList.filter(p => p.status === 'in_escrow').reduce((sum, p) => sum + p.amount, 0);
  }

  get completed(): number {
    return this.paymentsList.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  }

  getStatusClass(status: PaymentRow['status']): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_escrow': return 'bg-amber-100 text-amber-700';
      case 'refunded': return 'bg-muted text-muted-foreground';
    }
  }

  getStatusLabel(status: PaymentRow['status']): string {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_escrow': return 'In Escrow';
      case 'refunded': return 'Refunded';
    }
  }

}
