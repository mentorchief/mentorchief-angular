import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast.service';
import type { AppState } from '../../../store/app.state';
import { RATING_SCALE_MAX } from '../../../core/constants';
import { selectMenteeReportsWithMenteeNames } from '../store/dashboard.selectors';
import { selectAdminPayments } from '../../../store/admin/admin.selectors';
import { releasePayment } from '../../../store/admin/admin.actions';
import { AuthApiService } from '../../../core/services/auth-api.service';
import type { MenteeReport, AdminPayment } from '../../../core/models/dashboard.model';

const PAGE_SIZE = 5;

interface ReportWithMenteeName extends MenteeReport {
  menteeName: string;
}

interface ReportWithPayment extends ReportWithMenteeName {
  payment: AdminPayment | null;
  reportSubmitted: boolean;
}

@Component({
  selector: 'mc-admin-mentorship-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-6">
        <h1 class="text-2xl lg:text-3xl font-semibold text-foreground">Mentorship Reports</h1>
        <p class="text-muted-foreground mt-1.5 text-sm">Reports submitted by mentors. Review and release payment once verified.</p>
        <input
          type="text"
          [ngModel]="searchQuery"
          (ngModelChange)="onSearchChange($event)"
          placeholder="Search by mentor or mentee name..."
          class="mt-4 w-full max-w-md px-4 py-2 bg-input-background border border-border rounded-md text-sm"
        />
      </div>

      <!-- Table -->
      <div class="bg-card rounded-lg border border-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentor</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentee</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Date</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Rating</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Payment</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (reportsFiltered.length === 0) {
                <tr>
                  <td colspan="6" class="px-5 py-12 text-center text-muted-foreground text-sm">
                    No mentorship reports yet.
                  </td>
                </tr>
              }
              @for (report of reportsPaginated; track report.id) {
                <tr class="border-b border-border last:border-0 hover:bg-muted/20">
                  <td class="px-5 py-4">
                    <a [routerLink]="['/mentor', report.mentorId]" class="text-sm font-medium text-primary hover:underline no-underline">
                      {{ report.mentorName }}
                    </a>
                  </td>
                  <td class="px-5 py-4">
                    <a [routerLink]="['/dashboard/admin/users']" [queryParams]="{ search: report.menteeName }" class="text-sm font-medium text-primary hover:underline no-underline">
                      {{ report.menteeName }}
                    </a>
                  </td>
                  <td class="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">{{ formatDate(report.createdAt) }}</td>
                  <td class="px-5 py-4">
                    @if (report.rating != null) {
                      <div class="flex items-center gap-1">
                        @for (star of [1,2,3,4,5]; track star) {
                          <fa-icon [icon]="['fas', 'star']" class="w-3.5 h-3.5" [class.text-amber-400]="star <= report.rating!" [class.text-muted-foreground]="star > report.rating!" [class.opacity-30]="star > report.rating!" />
                        }
                        <span class="text-xs text-muted-foreground ml-1">{{ report.rating }}/{{ RATING_SCALE_MAX }}</span>
                      </div>
                    } @else {
                      <span class="text-muted-foreground text-sm">—</span>
                    }
                  </td>
                  <td class="px-5 py-4">
                    @if (report.payment) {
                      <div class="flex flex-col gap-1">
                        <span [class]="getPaymentStatusClass(report.payment.status)" class="px-2 py-0.5 rounded-md text-xs font-medium w-fit">
                          {{ getPaymentStatusLabel(report.payment.status) }}
                        </span>
                        <span class="text-xs text-muted-foreground">\${{ report.payment.amount }}</span>
                      </div>
                    } @else {
                      <span class="text-muted-foreground text-sm">—</span>
                    }
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="openReport(report)"
                        class="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted transition-colors"
                      >
                        View Report
                      </button>
                      @if (report.payment && report.payment.status === 'in_escrow') {
                        <button
                          (click)="onReleasePayment(report)"
                          [disabled]="releasingId === report.payment.id"
                          class="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          {{ releasingId === report.payment.id ? 'Releasing…' : 'Release Payment' }}
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (reportsFiltered.length > pageSize) {
          <div class="p-4 border-t border-border">
            <mc-pagination
              [totalItems]="reportsFiltered.length"
              [pageSize]="pageSize"
              [currentPage]="currentPage"
              (pageChange)="onPageChange($event)"
            />
          </div>
        }
      </div>
    </div>

    <!-- Report Detail Modal -->
    @if (selectedReport) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" (click)="closeReport()">
        <div class="bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <!-- Modal Header -->
          <div class="flex items-start justify-between px-6 py-5 border-b border-border sticky top-0 bg-card">
            <div>
              <h2 class="text-lg font-semibold text-foreground">{{ selectedReport.mentorName }} → {{ selectedReport.menteeName }}</h2>
              <p class="text-sm text-muted-foreground mt-0.5">{{ formatDate(selectedReport.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-3">
              @if (selectedReport.rating != null) {
                <div class="flex items-center gap-1">
                  @for (star of [1,2,3,4,5]; track star) {
                    <fa-icon [icon]="['fas', 'star']" class="w-4 h-4" [class.text-amber-400]="star <= selectedReport.rating!" [class.text-muted-foreground]="star > selectedReport.rating!" [class.opacity-30]="star > selectedReport.rating!" />
                  }
                  <span class="text-sm font-medium text-foreground ml-1">{{ selectedReport.rating }}/{{ RATING_SCALE_MAX }}</span>
                </div>
              }
              <button type="button" (click)="closeReport()" class="text-muted-foreground hover:text-foreground transition-colors p-1">
                <fa-icon [icon]="['fas', 'xmark']" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-6">
            <section>
              <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Summary</h3>
              <p class="text-sm text-foreground leading-relaxed whitespace-pre-line">{{ selectedReport.summary }}</p>
            </section>
            @if (selectedReport.behaviour) {
              <section class="pt-5 border-t border-border">
                <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Behaviour &amp; Professionalism</h3>
                <p class="text-sm text-foreground leading-relaxed">{{ selectedReport.behaviour }}</p>
              </section>
            }
            <div class="grid sm:grid-cols-3 gap-6 pt-5 border-t border-border">
              @if (selectedReport.strengths?.length) {
                <section>
                  <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Strengths</h3>
                  <ul class="space-y-2">
                    @for (s of selectedReport.strengths; track s) {
                      <li class="text-sm text-foreground flex gap-2"><span class="text-muted-foreground shrink-0">•</span><span>{{ s }}</span></li>
                    }
                  </ul>
                </section>
              }
              @if (selectedReport.weaknesses?.length) {
                <section>
                  <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Areas of Improvement</h3>
                  <ul class="space-y-2">
                    @for (w of selectedReport.weaknesses; track w) {
                      <li class="text-sm text-foreground flex gap-2"><span class="text-muted-foreground shrink-0">•</span><span>{{ w }}</span></li>
                    }
                  </ul>
                </section>
              }
              @if (selectedReport.areasToDevelop?.length) {
                <section>
                  <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Development Priorities</h3>
                  <ul class="space-y-2">
                    @for (a of selectedReport.areasToDevelop; track a) {
                      <li class="text-sm text-foreground flex gap-2"><span class="text-muted-foreground shrink-0">•</span><span>{{ a }}</span></li>
                    }
                  </ul>
                </section>
              }
            </div>
            @if (selectedReport.recommendations) {
              <section class="pt-5 border-t border-border">
                <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Recommendations</h3>
                <p class="text-sm text-foreground leading-relaxed whitespace-pre-line">{{ selectedReport.recommendations }}</p>
              </section>
            }

            <!-- Payment section in modal -->
            @if (selectedReport.payment) {
              <section class="pt-5 border-t border-border">
                <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Payment</h3>
                <div class="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                  <div>
                    <p class="text-sm font-medium text-foreground">\${{ selectedReport.payment.amount }}</p>
                    <p class="text-xs text-muted-foreground mt-0.5">{{ selectedReport.payment.date }}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span [class]="getPaymentStatusClass(selectedReport.payment.status)" class="px-2.5 py-1 rounded-md text-xs font-medium">
                      {{ getPaymentStatusLabel(selectedReport.payment.status) }}
                    </span>
                    @if (selectedReport.payment.status === 'in_escrow') {
                      <button
                        (click)="onReleasePayment(selectedReport); closeReport()"
                        [disabled]="releasingId === selectedReport.payment.id"
                        class="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Release Payment
                      </button>
                    }
                  </div>
                </div>
              </section>
            }
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMentorshipReportsPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly authApi = inject(AuthApiService);
  private readonly destroy$ = new Subject<void>();

  readonly RATING_SCALE_MAX = RATING_SCALE_MAX;
  reportsList: ReportWithMenteeName[] = [];
  paymentsList: AdminPayment[] = [];
  searchQuery = '';
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;
  releasingId: string | null = null;
  selectedReport: ReportWithPayment | null = null;

  ngOnInit(): void {
    this.store.select(selectMenteeReportsWithMenteeNames).pipe(takeUntil(this.destroy$)).subscribe((list) => {
      this.reportsList = list;
      this.cdr.markForCheck();
    });
    this.store.select(selectAdminPayments).pipe(takeUntil(this.destroy$)).subscribe((payments) => {
      this.paymentsList = payments;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Join reports with their corresponding payment (matched by mentor_id + mentee_id) */
  get reportsWithPayment(): ReportWithPayment[] {
    return this.reportsList.map((r) => {
      const payment = this.paymentsList.find(
        (p) => p.mentorId === r.mentorId && p.menteeId === r.menteeId,
      ) ?? null;
      return { ...r, payment, reportSubmitted: true };
    });
  }

  get reportsFiltered(): ReportWithPayment[] {
    const list = this.reportsWithPayment;
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (r) =>
        (r.mentorName && r.mentorName.toLowerCase().includes(q)) ||
        (r.menteeName && r.menteeName.toLowerCase().includes(q)) ||
        (r.summary && r.summary.toLowerCase().includes(q)),
    );
  }

  get reportsPaginated(): ReportWithPayment[] {
    const list = this.reportsFiltered;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.cdr.markForCheck();
  }

  openReport(report: ReportWithPayment): void {
    this.selectedReport = report;
    this.cdr.markForCheck();
  }

  closeReport(): void {
    this.selectedReport = null;
    this.cdr.markForCheck();
  }

  async onReleasePayment(report: ReportWithPayment): Promise<void> {
    if (!report.payment) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Release Payment',
      message: `Release $${report.payment.amount} to ${report.mentorName}? This action cannot be undone. Manually transfer the funds before confirming.`,
      confirmLabel: 'Yes, Release',
      cancelLabel: 'Cancel',
      variant: 'primary',
    });
    if (!confirmed) return;

    this.releasingId = report.payment.id;
    this.cdr.markForCheck();

    this.authApi.releasePayment(report.payment.id).subscribe({
      next: () => {
        this.store.dispatch(releasePayment({ paymentId: report.payment!.id }));
        // Notify mentor payment released
        if (report.mentorId) {
          this.authApi.createNotification({
            userId: report.mentorId,
            type: 'payment_released',
            title: 'Payment released',
            body: `Your payment of $${report.payment!.amount} for mentoring ${report.menteeName} has been released.`,
            metadata: { paymentId: report.payment!.id },
          }).subscribe();
        }
        this.toast.success(`Payment of $${report.payment!.amount} released to ${report.mentorName}.`);
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

  getPaymentStatusClass(status: AdminPayment['status']): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_escrow': return 'bg-amber-100 text-amber-700';
      case 'disputed': return 'bg-destructive/10 text-destructive';
      case 'refunded': return 'bg-muted text-muted-foreground';
    }
  }

  getPaymentStatusLabel(status: AdminPayment['status']): string {
    switch (status) {
      case 'completed': return 'Payment Released';
      case 'in_escrow': return 'In Escrow';
      case 'disputed': return 'Disputed';
      case 'refunded': return 'Refunded';
    }
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return iso;
    }
  }
}
