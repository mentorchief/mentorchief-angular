import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, take } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { ToastService } from '../../../shared/services/toast.service';
import type { AppState } from '../../../store/app.state';
import { selectMentorEarningsForDisplay, selectMentorActiveMentees, selectMentorPayoutAccount } from '../store/dashboard.selectors';
import { updateMentorPayoutAccount } from '../store/dashboard.actions';

type EarningRow = { id: string; date: string; mentee: string; amount: number; status: 'paid' | 'in_escrow' | 'pending'; period: string };

const PAGE_SIZE = 10;

@Component({
  selector: 'mc-mentor-earnings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FontAwesomeModule, PaginationComponent],
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
          <button type="button" (click)="openPayoutDialog()" class="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-muted">
            Update
          </button>
        </div>
        <div class="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          @if ((payoutAccount$ | async); as payoutAccount) {
          @if (payoutAccount.type === 'bank') {
            <div class="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span class="text-white text-xs font-bold">BANK</span>
            </div>
            <div class="flex-1">
              <p class="text-foreground text-sm font-medium">{{ payoutAccount.bankName }} •••• {{ payoutAccount.accountNumber?.slice(-4) ?? '----' }}</p>
            </div>
          } @else {
            <div class="w-12 h-8 bg-indigo-600 rounded flex items-center justify-center">
              <span class="text-white text-xs font-bold">INSTAPAY</span>
            </div>
            <div class="flex-1">
              <p class="text-foreground text-sm font-medium">•••• {{ payoutAccount.instapayNumber?.slice(-4) ?? '----' }}</p>
              <p class="text-muted-foreground text-xs">Instapay</p>
            </div>
          }
          }
        </div>
      </div>
    </div>

    <!-- Payout Account Dialog -->
    @if (payoutDialogOpen) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payout-dialog-title"
      >
        <div class="absolute inset-0 bg-foreground/50 backdrop-blur-sm" (click)="closePayoutDialog()"></div>
        <div class="relative bg-card rounded-lg shadow-xl border border-border max-w-md w-full p-6" (click)="$event.stopPropagation()">
          <h2 id="payout-dialog-title" class="text-lg font-medium text-foreground mb-4">Update Payout Account</h2>
          <form [formGroup]="payoutForm" (ngSubmit)="onSavePayout()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Account Type <span class="text-destructive">*</span></label>
              <select formControlName="type" (change)="onPayoutTypeChange()" class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm">
                <option value="bank">Bank Account</option>
                <option value="instapay">Instapay</option>
              </select>
            </div>
            @if (payoutForm.get('type')?.value === 'bank') {
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Bank Name <span class="text-destructive">*</span></label>
                <input formControlName="bankName" type="text" placeholder="e.g. Chase Bank" class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm" />
                @if (payoutForm.get('bankName')?.invalid && payoutForm.get('bankName')?.touched) {
                  <p class="text-destructive text-xs mt-1">Bank name is required</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Account Number <span class="text-destructive">*</span></label>
                <input formControlName="accountNumber" type="text" placeholder="Account number" class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm" />
                @if (payoutForm.get('accountNumber')?.invalid && payoutForm.get('accountNumber')?.touched) {
                  <p class="text-destructive text-xs mt-1">Account number is required (min 8 characters)</p>
                }
              </div>
            } @else {
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Instapay Number <span class="text-destructive">*</span></label>
                <input formControlName="instapayNumber" type="text" placeholder="Phone number or Instapay ID" class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm" />
                @if (payoutForm.get('instapayNumber')?.invalid && payoutForm.get('instapayNumber')?.touched) {
                  <p class="text-destructive text-xs mt-1">Instapay number is required (min 10 characters)</p>
                }
              </div>
            }
            <div class="flex justify-end gap-3 pt-4">
              <button type="button" (click)="closePayoutDialog()" class="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted">
                Cancel
              </button>
              <button type="submit" [disabled]="payoutForm.invalid" class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorEarningsPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  earningsList: EarningRow[] = [];
  activeMenteesCount = 0;
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;
  searchQuery = '';
  filterStatus = '';
  payoutDialogOpen = false;
  readonly payoutAccount$ = this.store.select(selectMentorPayoutAccount);
  payoutForm: FormGroup = this.fb.group({
    type: ['bank' as const, Validators.required],
    bankName: ['', Validators.required],
    accountNumber: ['', [Validators.required, Validators.minLength(8)]],
    instapayNumber: ['', [Validators.required, Validators.minLength(10)]],
  });

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

  openPayoutDialog(): void {
    this.payoutAccount$.pipe(take(1)).subscribe((payoutAccount) => {
      this.payoutForm.patchValue({
        type: payoutAccount.type,
        bankName: payoutAccount.bankName ?? '',
        accountNumber: payoutAccount.accountNumber ?? '',
        instapayNumber: payoutAccount.instapayNumber ?? '',
      });
      this.updatePayoutValidators();
      this.payoutDialogOpen = true;
      this.cdr.markForCheck();
    });
  }

  onPayoutTypeChange(): void {
    this.updatePayoutValidators();
    this.cdr.markForCheck();
  }

  closePayoutDialog(): void {
    this.payoutDialogOpen = false;
    this.cdr.markForCheck();
  }

  private updatePayoutValidators(): void {
    const type = this.payoutForm.get('type')?.value;
    const bankName = this.payoutForm.get('bankName');
    const accountNumber = this.payoutForm.get('accountNumber');
    const instapayNumber = this.payoutForm.get('instapayNumber');
    if (type === 'bank') {
      bankName?.setValidators([Validators.required]);
      accountNumber?.setValidators([Validators.required, Validators.minLength(8)]);
      instapayNumber?.clearValidators();
    } else {
      bankName?.clearValidators();
      accountNumber?.clearValidators();
      instapayNumber?.setValidators([Validators.required, Validators.minLength(10)]);
    }
    bankName?.updateValueAndValidity();
    accountNumber?.updateValueAndValidity();
    instapayNumber?.updateValueAndValidity();
  }

  onSavePayout(): void {
    if (this.payoutForm.invalid) return;
    const v = this.payoutForm.getRawValue();
    const payoutAccount = v.type === 'bank'
      ? { type: 'bank' as const, bankName: v.bankName, accountNumber: v.accountNumber }
      : { type: 'instapay' as const, instapayNumber: v.instapayNumber };
    this.store.dispatch(updateMentorPayoutAccount({ payoutAccount }));
    this.closePayoutDialog();
    this.toast.success('Payout account updated successfully.');
    this.cdr.markForCheck();
  }
}
