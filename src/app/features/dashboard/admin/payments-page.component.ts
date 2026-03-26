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
import { addPayment, refundPayment, releasePayment } from '../../../store/admin/admin.actions';
import { AuthApiService, type MentorshipWithProfiles } from '../../../core/services/auth-api.service';
import type { AdminPayment } from '../../../core/models/dashboard.model';
import { selectMenteeReports } from '../../../store/reports';

const PAGE_SIZE = 10;

@Component({
  selector: 'mc-admin-payments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-2xl lg:text-3xl text-foreground">Payments</h1>
          <p class="text-muted-foreground mt-1">Monitor and release platform transactions</p>
        </div>
        <button
          (click)="openCreateModal()"
          class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          + Create Payment
        </button>
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
            <option value="completed">Released</option>
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
                    @if (payment.status === 'in_escrow') {
                      <div class="flex items-center gap-2">
                        @if (hasReport(payment)) {
                          <button
                            (click)="onReleasePayment(payment)"
                            [disabled]="releasingId === payment.id"
                            class="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {{ releasingId === payment.id ? 'Releasing...' : 'Release' }}
                          </button>
                        } @else {
                          <span class="text-xs text-muted-foreground" title="No report submitted yet">No report yet</span>
                        }
                        <button
                          (click)="onRefundPayment(payment)"
                          [disabled]="refundingId === payment.id"
                          class="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs rounded-md hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                        >
                          {{ refundingId === payment.id ? 'Refunding...' : 'Refund' }}
                        </button>
                      </div>
                    } @else {
                      <span class="text-xs text-muted-foreground">&mdash;</span>
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

    <!-- Create Payment Modal -->
    @if (showCreateModal) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" (click)="closeCreateModal()"></div>
        <div class="relative bg-card rounded-lg border border-border shadow-lg w-full max-w-lg mx-4 p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-foreground">Create Payment Record</h2>
            <button (click)="closeCreateModal()" class="text-muted-foreground hover:text-foreground transition-colors">
              &#x2715;
            </button>
          </div>

          @if (loadingMentorships) {
            <div class="flex items-center justify-center py-8">
              <span class="text-muted-foreground text-sm">Loading mentorships...</span>
            </div>
          } @else {
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">Mentorship</label>
                <select
                  [(ngModel)]="createForm.mentorshipId"
                  (ngModelChange)="onMentorshipSelect($event)"
                  class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm"
                >
                  <option value="">Select a mentorship...</option>
                  @for (m of mentorships; track m.id) {
                    <option [value]="m.id">
                      {{ m.mentee_profile?.name || 'Unknown' }} &larr; {{ m.mentor_profile?.name || 'Unknown' }} ({{ m.status }})
                    </option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-1">Amount ($)</label>
                <input
                  type="number"
                  [(ngModel)]="createForm.amount"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-1">Payment Reference <span class="text-muted-foreground font-normal">(optional)</span></label>
                <input
                  type="text"
                  [(ngModel)]="createForm.paymentReference"
                  placeholder="e.g. bank transfer ref, invoice #"
                  class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-1">Admin Notes <span class="text-muted-foreground font-normal">(optional)</span></label>
                <textarea
                  [(ngModel)]="createForm.adminNotes"
                  rows="3"
                  placeholder="Internal notes about this payment..."
                  class="w-full px-4 py-2 bg-input-background border border-border rounded-md text-sm resize-none"
                ></textarea>
              </div>

              <div class="flex justify-end gap-3 pt-2">
                <button
                  (click)="closeCreateModal()"
                  class="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted/50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  (click)="onCreatePayment()"
                  [disabled]="creatingPayment || !createForm.mentorshipId || !createForm.amount"
                  class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {{ creatingPayment ? 'Creating...' : 'Create Payment' }}
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }
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
  refundingId: string | null = null;

  // Create payment modal state
  showCreateModal = false;
  loadingMentorships = false;
  creatingPayment = false;
  mentorships: MentorshipWithProfiles[] = [];
  createForm = {
    mentorshipId: '',
    amount: null as number | null,
    paymentReference: '',
    adminNotes: '',
  };
  private selectedMentorship: MentorshipWithProfiles | null = null;

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

  // ─── Release Payment ─────────────────────────────────────────────────────

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

  // ─── Refund Payment ───────────────────────────────────────────────────────

  async onRefundPayment(payment: AdminPayment): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Refund Payment',
      message: `Refund $${payment.amount} to ${payment.mentee}? This action cannot be undone.`,
      confirmLabel: 'Yes, Refund',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    this.refundingId = payment.id;
    this.cdr.markForCheck();

    this.authApi.refundPayment(payment.id).subscribe({
      next: () => {
        this.store.dispatch(refundPayment({ paymentId: payment.id }));
        // Notify mentee about refund
        if (payment.menteeId) {
          this.authApi.createNotification({
            userId: payment.menteeId,
            type: 'payment_updated',
            title: 'Payment refunded',
            body: `Your payment of $${payment.amount} has been refunded.`,
            metadata: { paymentId: payment.id },
          }).subscribe();
        }
        // Notify mentor about refund
        if (payment.mentorId) {
          this.authApi.createNotification({
            userId: payment.mentorId,
            type: 'payment_updated',
            title: 'Payment refunded',
            body: `A payment of $${payment.amount} from ${payment.mentee} has been refunded.`,
            metadata: { paymentId: payment.id },
          }).subscribe();
        }
        this.toast.success(`Payment of $${payment.amount} refunded to ${payment.mentee}.`);
        this.refundingId = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to refund payment. Please try again.');
        this.refundingId = null;
        this.cdr.markForCheck();
      },
    });
  }

  // ─── Create Payment Modal ─────────────────────────────────────────────────

  openCreateModal(): void {
    this.showCreateModal = true;
    this.loadingMentorships = true;
    this.resetCreateForm();
    this.cdr.markForCheck();

    this.authApi.getAllMentorships().subscribe({
      next: (mentorships) => {
        this.mentorships = mentorships.filter(
          (m) => m.status === 'active' || m.status === 'pending',
        );
        this.loadingMentorships = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load mentorships.');
        this.loadingMentorships = false;
        this.cdr.markForCheck();
      },
    });
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetCreateForm();
    this.cdr.markForCheck();
  }

  onMentorshipSelect(mentorshipId: string): void {
    this.selectedMentorship = this.mentorships.find((m) => m.id === mentorshipId) ?? null;
  }

  onCreatePayment(): void {
    if (!this.selectedMentorship || !this.createForm.amount) return;

    const mentorship = this.selectedMentorship;
    const menteeId = mentorship.mentee_id;
    const mentorId = mentorship.mentor_id;
    const menteeName = mentorship.mentee_profile?.name ?? 'Unknown';
    const mentorName = mentorship.mentor_profile?.name ?? 'Unknown';

    this.creatingPayment = true;
    this.cdr.markForCheck();

    this.authApi.createPaymentRecord({
      menteeId,
      mentorId,
      amount: this.createForm.amount,
      currency: 'usd',
      planName: 'admin_manual',
      paymentReference: this.createForm.paymentReference || undefined,
      adminNotes: this.createForm.adminNotes || undefined,
    }).subscribe({
      next: (paymentRow) => {
        // Add payment to the store
        const newPayment: AdminPayment = {
          id: paymentRow.id,
          date: new Date(paymentRow.created_at).toLocaleDateString(),
          mentee: menteeName,
          mentor: mentorName,
          amount: paymentRow.amount,
          status: 'in_escrow',
          menteeId,
          mentorId,
        };
        this.store.dispatch(addPayment({ payment: newPayment }));

        // Activate the mentorship
        this.authApi.adminActivateMentorship(mentorship.id).subscribe();

        // Notify mentee
        this.authApi.createNotification({
          userId: menteeId,
          type: 'payment_updated',
          title: 'Mentorship started',
          body: 'Your payment has been confirmed and mentorship is now active.',
          metadata: { paymentId: paymentRow.id, mentorshipId: mentorship.id },
        }).subscribe();

        // Notify mentor
        this.authApi.createNotification({
          userId: mentorId,
          type: 'payment_updated',
          title: 'New payment received',
          body: 'Payment has been confirmed for your mentorship.',
          metadata: { paymentId: paymentRow.id, mentorshipId: mentorship.id },
        }).subscribe();

        this.toast.success(`Payment of $${this.createForm.amount} created successfully.`);
        this.creatingPayment = false;
        this.closeCreateModal();
      },
      error: () => {
        this.toast.error('Failed to create payment. Please try again.');
        this.creatingPayment = false;
        this.cdr.markForCheck();
      },
    });
  }

  private resetCreateForm(): void {
    this.createForm = { mentorshipId: '', amount: null, paymentReference: '', adminNotes: '' };
    this.selectedMentorship = null;
    this.creatingPayment = false;
  }

  // ─── Summary Cards ────────────────────────────────────────────────────────

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
