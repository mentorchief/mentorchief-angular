import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, debounceTime, distinctUntilChanged, take, takeUntil } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { ToastService } from '../../../shared/services/toast.service';
import type { AppState } from '../../../store/app.state';
import { selectMentorPayoutAccount, selectMentorActiveMentees } from '../store/dashboard.selectors';
import { selectAuthUserId } from '../../auth/store/auth.selectors';
import { updateMentorPayoutAccount } from '../store/dashboard.actions';
import { AuthApiService } from '../../../core/services/auth-api.service';

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
          <p class="text-2xl text-foreground font-semibold">\${{ summaryTotalEarned }}</p>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-amber-100 rounded-md flex items-center justify-center">
              <fa-icon [icon]="['fas', 'lock']" class="text-amber-600 w-5 h-5" />
            </div>
            <span class="text-muted-foreground text-sm">In Escrow</span>
          </div>
          <p class="text-2xl text-foreground font-semibold">\${{ summaryInEscrow }}</p>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
              <fa-icon [icon]="['fas', 'calendar']" class="text-blue-600 w-5 h-5" />
            </div>
            <span class="text-muted-foreground text-sm">This Month</span>
          </div>
          <p class="text-2xl text-foreground font-semibold">\${{ summaryThisMonth }}</p>
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
      @if (summaryInEscrow > 0) {
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-amber-100 rounded-md flex items-center justify-center shrink-0">
              <fa-icon [icon]="['fas', 'clock']" class="text-amber-600 w-5 h-5" />
            </div>
            <div class="flex-1">
              <h3 class="text-amber-900 font-medium">Pending Payout</h3>
              <p class="text-amber-700 text-sm mt-1">
                \${{ summaryInEscrow }} will be released to your account when current mentorship periods complete.
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Earnings History (BE-driven) -->
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
              <option value="released">Paid</option>
              <option value="in_escrow">In Escrow</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        @if (loading) {
          <div class="p-10 text-center text-muted-foreground text-sm">Loading earnings...</div>
        } @else {
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
                @for (earning of earningsList; track earning.id) {
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
              [totalItems]="totalCount"
              [pageSize]="pageSize"
              [currentPage]="currentPage"
              (pageChange)="onPageChange($event)"
            />
          </div>
        }
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
                  <p class="text-destructive text-xs mt-1">Bank name is required (min 2 characters)</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Account Number <span class="text-destructive">*</span></label>
                <input formControlName="accountNumber" type="text" placeholder="Account number (digits only)" class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm" />
                @if (payoutForm.get('accountNumber')?.invalid && payoutForm.get('accountNumber')?.touched) {
                  <p class="text-destructive text-xs mt-1">Account number: 10-20 digits required</p>
                }
              </div>
            } @else {
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">Instapay Number <span class="text-destructive">*</span></label>
                <input formControlName="instapayNumber" type="text" placeholder="01XXXXXXXXX" class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm" />
                @if (payoutForm.get('instapayNumber')?.invalid && payoutForm.get('instapayNumber')?.touched) {
                  <p class="text-destructive text-xs mt-1">Must start with 01 and be 11 digits</p>
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
  private readonly authApi = inject(AuthApiService);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  earningsList: EarningRow[] = [];
  totalCount = 0;
  activeMenteesCount = 0;
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;
  searchQuery = '';
  filterStatus = '';
  loading = false;
  payoutDialogOpen = false;
  readonly payoutAccount$ = this.store.select(selectMentorPayoutAccount);

  // Summary stats from full (unfiltered) payment data
  summaryTotalEarned = 0;
  summaryInEscrow = 0;
  summaryThisMonth = 0;

  payoutForm: FormGroup = this.fb.group({
    type: ['bank' as const, Validators.required],
    bankName: ['', [Validators.required, Validators.minLength(2)]],
    accountNumber: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(20), Validators.pattern(/^\d+$/)]],
    instapayNumber: ['', [Validators.required, Validators.pattern(/^01\d{9}$/)]],
  });

  private mentorId: string | null = null;

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.currentPage = 1;
      this.fetchEarnings();
    });

    this.store.select(selectMentorActiveMentees).pipe(takeUntil(this.destroy$)).subscribe((mentees) => {
      this.activeMenteesCount = mentees.length;
      this.cdr.markForCheck();
    });

    this.store.select(selectAuthUserId).pipe(takeUntil(this.destroy$)).subscribe((id) => {
      if (id && id !== this.mentorId) {
        this.mentorId = id;
        this.fetchSummary();
        this.fetchEarnings();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
    this.search$.next(value);
  }

  onFilterStatusChange(value: string): void {
    this.filterStatus = value;
    this.currentPage = 1;
    this.fetchEarnings();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.fetchEarnings();
  }

  /** Fetch summary stats from all payments (no filter/pagination). */
  private fetchSummary(): void {
    if (!this.mentorId) return;
    this.authApi.getMentorPayments(this.mentorId).pipe(takeUntil(this.destroy$)).subscribe((rows) => {
      this.summaryTotalEarned = rows.filter((r) => r.status === 'released').reduce((s, r) => s + r.amount, 0);
      this.summaryInEscrow = rows.filter((r) => r.status === 'in_escrow').reduce((s, r) => s + r.amount, 0);
      const now = new Date();
      const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      this.summaryThisMonth = rows.filter((r) => r.created_at?.startsWith(thisMonthKey)).reduce((s, r) => s + r.amount, 0);
      this.cdr.markForCheck();
    });
  }

  /** Fetch paginated earnings from BE. */
  private fetchEarnings(): void {
    if (!this.mentorId) return;
    this.loading = true;
    this.cdr.markForCheck();

    this.authApi.searchMentorPayments(this.mentorId, {
      query: this.searchQuery || undefined,
      status: this.filterStatus || undefined,
      page: this.currentPage,
      pageSize: this.pageSize,
    }).pipe(takeUntil(this.destroy$)).subscribe(({ data, count }) => {
      this.earningsList = data.map((r, i): EarningRow => ({
        id: r.id ?? String(i),
        date: r.release_date ?? r.created_at?.split('T')[0] ?? '—',
        mentee: r.mentee_profile?.name ?? 'Mentee',
        amount: r.amount,
        status: r.status === 'released' ? 'paid' : r.status === 'in_escrow' ? 'in_escrow' : 'pending',
        period: r.month ?? '—',
      }));
      this.totalCount = count;
      this.loading = false;
      this.cdr.markForCheck();
    });
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
      bankName?.setValidators([Validators.required, Validators.minLength(2)]);
      accountNumber?.setValidators([Validators.required, Validators.minLength(10), Validators.maxLength(20), Validators.pattern(/^\d+$/)]);
      instapayNumber?.clearValidators();
    } else {
      bankName?.clearValidators();
      accountNumber?.clearValidators();
      instapayNumber?.setValidators([Validators.required, Validators.pattern(/^01\d{9}$/)]);
    }
    bankName?.updateValueAndValidity();
    accountNumber?.updateValueAndValidity();
    instapayNumber?.updateValueAndValidity();
  }

  onSavePayout(): void {
    if (this.payoutForm.invalid || !this.mentorId) return;
    const v = this.payoutForm.getRawValue();
    const payoutAccount = v.type === 'bank'
      ? { type: 'bank' as const, bankName: v.bankName, accountNumber: v.accountNumber }
      : { type: 'instapay' as const, instapayNumber: v.instapayNumber };

    // Persist to Supabase via API
    this.authApi.updateMentorPayoutAccount(this.mentorId, payoutAccount).subscribe({
      next: () => {
        this.store.dispatch(updateMentorPayoutAccount({ payoutAccount }));
        this.closePayoutDialog();
        this.toast.success('Payout account updated successfully.');
      },
      error: () => {
        this.toast.error('Failed to update payout account. Please try again.');
      },
    });
  }
}
