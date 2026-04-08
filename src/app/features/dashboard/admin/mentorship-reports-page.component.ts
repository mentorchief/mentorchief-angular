import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { map } from 'rxjs';
import { RATING_SCALE_MAX } from '../../../core/constants';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import type { MenteeReport } from '../../../core/models/dashboard.model';
import { ReportsFacade } from '../../../core/facades/reports.facade';
import { UsersFacade } from '../../../core/facades/users.facade';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { MentorFacade } from '../../../core/facades/mentor.facade';
import { ToastService } from '../../../shared/services/toast.service';

const PAGE_SIZE = 5;

/** MenteeReport with menteeName resolved by selector */
interface ReportWithMenteeName extends MenteeReport {
  menteeName: string;
}

@Component({
  selector: 'mc-admin-mentorship-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl font-semibold text-foreground">Mentorship Reports</h1>
        <p class="text-muted-foreground mt-1.5 text-sm">All formal reports submitted by mentors at the end of a mentorship. Visible to the mentee and, where applicable, to their next mentors.</p>
        <input
          type="text"
          [ngModel]="searchQuery"
          (ngModelChange)="onSearchChange($event)"
          placeholder="Search by mentor, mentee name or summary..."
          class="mt-4 w-full max-w-md px-4 py-2 bg-input-background border border-border rounded-md text-sm"
        />
      </div>

      @if (reportsFiltered.length) {
        <div class="space-y-8">
          @for (report of reportsPaginated; track report.id) {
            <article class="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <header class="border-b border-border bg-muted/30 px-6 py-5">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p class="text-xs uppercase tracking-wider text-muted-foreground font-medium">Mentorship Report</p>
                    <h2 class="text-lg font-semibold text-foreground mt-1"><a [routerLink]="['/mentor', report.mentorId]" class="text-primary hover:underline no-underline">{{ report.mentorName }}</a> — {{ report.menteeName }}</h2>
                    <p class="text-sm text-muted-foreground mt-0.5">{{ formatDate(report.createdAt) }}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    @if (report.rating != null) {
                      <div class="flex items-center gap-1 text-muted-foreground">
                        @for (star of [1,2,3,4,5]; track star) {
                          <fa-icon [icon]="['fas', 'star']" class="w-4 h-4" [class.text-foreground]="star <= report.rating!" [class.opacity-40]="star > report.rating!" />
                        }
                        <span class="text-sm font-medium text-foreground ml-1.5">{{ report.rating }}/{{ RATING_SCALE_MAX }}</span>
                      </div>
                    }
                    <span
                      [class]="reportStatusBadgeClass(report)"
                      class="text-xs font-medium uppercase tracking-wider px-2 py-1 rounded-md"
                    >
                      {{ reportStatusLabel(report) }}
                    </span>
                  </div>
                </div>
              </header>
              <div class="p-6 space-y-6">
                <section>
                  <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Summary</h3>
                  <p class="text-sm text-foreground leading-relaxed whitespace-pre-line">{{ report.summary }}</p>
                </section>
                @if (report.behaviour) {
                  <section class="pt-5 border-t border-border">
                    <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Behaviour &amp; Professionalism</h3>
                    <p class="text-sm text-foreground leading-relaxed">{{ report.behaviour }}</p>
                  </section>
                }
                <div class="grid sm:grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-border">
                  @if (report.strengths?.length) {
                    <section>
                      <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Strengths</h3>
                      <ul class="space-y-2">
                        @for (s of report.strengths; track s) {
                          <li class="text-sm text-foreground flex gap-2"><span class="text-muted-foreground shrink-0">•</span><span>{{ s }}</span></li>
                        }
                      </ul>
                    </section>
                  }
                  @if (report.weaknesses?.length) {
                    <section>
                      <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Areas of Improvement</h3>
                      <ul class="space-y-2">
                        @for (w of report.weaknesses; track w) {
                          <li class="text-sm text-foreground flex gap-2"><span class="text-muted-foreground shrink-0">•</span><span>{{ w }}</span></li>
                        }
                      </ul>
                    </section>
                  }
                  @if (report.areasToDevelop?.length) {
                    <section>
                      <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Development Priorities</h3>
                      <ul class="space-y-2">
                        @for (a of report.areasToDevelop; track a) {
                          <li class="text-sm text-foreground flex gap-2"><span class="text-muted-foreground shrink-0">•</span><span>{{ a }}</span></li>
                        }
                      </ul>
                    </section>
                  }
                </div>
                @if (report.recommendations) {
                  <section class="pt-5 border-t border-border">
                    <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Recommendations</h3>
                    <p class="text-sm text-foreground leading-relaxed whitespace-pre-line">{{ report.recommendations }}</p>
                  </section>
                }
                @if (report.adminReviewNote) {
                  <section class="pt-5 border-t border-border">
                    <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Admin review note</h3>
                    <p class="text-sm text-foreground leading-relaxed whitespace-pre-line">{{ report.adminReviewNote }}</p>
                  </section>
                }
                @if ((report.adminReviewStatus ?? 'pending') === 'pending') {
                  <section class="pt-5 border-t border-border flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      (click)="onApproveReport(report)"
                      class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    >
                      Approve report & release payout
                    </button>
                    <button
                      type="button"
                      (click)="onRejectReport(report)"
                      class="px-4 py-2 border border-destructive text-destructive rounded-md text-sm hover:bg-destructive/5"
                    >
                      Reject report
                    </button>
                  </section>
                }
              </div>
            </article>
          }
        </div>
        <div class="mt-6">
          <mc-pagination
            [totalItems]="reportsFiltered.length"
            [pageSize]="pageSize"
            [currentPage]="currentPage"
            (pageChange)="onPageChange($event)"
          />
        </div>
      } @else {
        <div class="bg-card rounded-lg border border-border p-10 text-center">
          <div class="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-5">
            <fa-icon [icon]="['fas', 'file-lines']" class="text-xl text-muted-foreground" />
          </div>
          <h3 class="text-base font-semibold text-foreground">No mentorship reports yet</h3>
          <p class="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            When mentors end a mentorship from My Mentees, they submit a formal report. Reports appear here and are shared with the mentee and their next mentors.
          </p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMentorshipReportsPageComponent implements OnInit, OnDestroy {
  private readonly reports = inject(ReportsFacade);
  private readonly userSvc = inject(UsersFacade);
  private readonly auth = inject(AuthFacade);
  private readonly mentorFacade = inject(MentorFacade);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly RATING_SCALE_MAX = RATING_SCALE_MAX;
  reportsList: ReportWithMenteeName[] = [];
  searchQuery = '';
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;

  ngOnInit(): void {
    this.reports.menteeReports$.pipe(
      map((rpts) => rpts.map((r) => ({
        ...r,
        menteeName: this.userSvc.getById(r.menteeId)?.name ?? `Mentee #${r.menteeId}`,
      }))),
      takeUntil(this.destroy$),
    ).subscribe((list) => {
      this.reportsList = list;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get reportsFiltered(): ReportWithMenteeName[] {
    const list = this.reportsList;
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (r) =>
        (r.mentorName && r.mentorName.toLowerCase().includes(q)) ||
        (r.menteeName && r.menteeName.toLowerCase().includes(q)) ||
        (r.summary && r.summary.toLowerCase().includes(q))
    );
  }

  get reportsPaginated(): ReportWithMenteeName[] {
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

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  reportStatusLabel(report: MenteeReport): string {
    const s = report.adminReviewStatus ?? 'pending';
    if (s === 'approved') return 'Approved';
    if (s === 'rejected') return 'Rejected';
    return 'Pending review';
  }

  reportStatusBadgeClass(report: MenteeReport): string {
    const s = report.adminReviewStatus ?? 'pending';
    if (s === 'approved') return 'bg-green-100 text-green-700';
    if (s === 'rejected') return 'bg-destructive/10 text-destructive';
    return 'bg-amber-100 text-amber-700';
  }

  onApproveReport(report: ReportWithMenteeName): void {
    const reviewerId = this.auth.currentUser?.id ?? 'admin';
    this.reports.reviewMenteeReport(report.id, 'approved', reviewerId);
    this.mentorFacade.markMenteeCompleted(Number(report.menteeId));
    this.toast.success(`Report approved. Payout for ${report.menteeName} has been released to mentor escrow cycle.`);
    this.cdr.markForCheck();
  }

  onRejectReport(report: ReportWithMenteeName): void {
    const reviewerId = this.auth.currentUser?.id ?? 'admin';
    this.reports.reviewMenteeReport(report.id, 'rejected', reviewerId, 'Please revise and resubmit with clearer development outcomes.');
    this.toast.success(`Report rejected for ${report.menteeName}. Mentor can revise and resubmit.`);
    this.cdr.markForCheck();
  }
}
