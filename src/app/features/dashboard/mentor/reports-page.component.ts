import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { map } from 'rxjs';
import { RATING_SCALE_MAX } from '../../../core/constants';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import type { MenteeReport } from '../../../core/models/dashboard.model';
import { ReportsFacade } from '../../../core/facades/reports.facade';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { MentorFacade } from '../../../core/facades/mentor.facade';
import { UsersFacade } from '../../../core/facades/users.facade';

const PAGE_SIZE = 5;

/** MenteeReport with menteeName resolved by selector */
interface ReportWithMenteeName extends MenteeReport {
  menteeName: string;
}

@Component({
  selector: 'mc-mentor-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl font-semibold text-foreground">Mentorship Reports</h1>
        <p class="text-muted-foreground mt-1.5 text-sm">Reports you have submitted at the end of each mentorship. They are shared with the mentee and visible to their next mentors.</p>
        <input
          type="text"
          [ngModel]="searchQuery"
          (ngModelChange)="onSearchChange($event)"
          placeholder="Search by mentee name or summary..."
          class="mt-4 w-full max-w-md px-4 py-2 bg-input-background border border-border rounded-md text-sm"
        />
      </div>

      @if (reportsFiltered.length) {
        <div class="bg-card rounded-lg border border-border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-muted/50">
                <tr>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentee</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Date</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Admin Review</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Rating</th>
                  <th class="w-[28%] text-left px-5 py-3 text-sm font-medium text-muted-foreground">Summary</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (report of reportsPaginated; track report.id) {
                  <tr class="border-b border-border last:border-0 hover:bg-muted/30">
                    <td class="px-5 py-4 text-sm text-foreground font-medium">{{ report.menteeName }}</td>
                    <td class="px-5 py-4 text-sm text-muted-foreground">{{ formatDate(report.createdAt) }}</td>
                    <td class="px-5 py-4">
                      <span
                        [class]="reviewBadgeClass(report)"
                        class="px-2.5 py-1 rounded-md text-xs whitespace-nowrap"
                      >
                        {{ reviewLabel(report) }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-sm text-foreground">
                      {{ report.rating != null ? report.rating + '/' + RATING_SCALE_MAX : 'N/A' }}
                    </td>
                    <td class="w-[28%] px-5 py-4 text-sm text-muted-foreground">{{ truncate(report.summary, 80) }}</td>
                    <td class="px-5 py-4">
                      <button
                        type="button"
                        (click)="openDetails(report)"
                        class="px-3 py-1.5 border border-border rounded-md text-xs text-foreground hover:bg-muted"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        @if (selectedReport) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" (click)="closeDetails()">
            <div class="bg-card rounded-lg border border-border shadow-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6" (click)="$event.stopPropagation()">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="text-lg font-semibold text-foreground">Report for {{ selectedReport.menteeName }}</h2>
                  <p class="text-sm text-muted-foreground mt-1">{{ formatDate(selectedReport.createdAt) }}</p>
                </div>
                <button type="button" (click)="closeDetails()" class="px-3 py-1.5 border border-border rounded-md text-xs hover:bg-muted">Close</button>
              </div>

              <div class="mt-6 space-y-5">
                <section>
                  <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Summary</h3>
                  <p class="text-sm text-foreground leading-relaxed whitespace-pre-line">{{ selectedReport.summary }}</p>
                </section>
                @if (selectedReport.behaviour) {
                  <section>
                    <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Behaviour & Professionalism</h3>
                    <p class="text-sm text-foreground leading-relaxed">{{ selectedReport.behaviour }}</p>
                  </section>
                }
                @if (selectedReport.strengths?.length) {
                  <section>
                    <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Strengths</h3>
                    <p class="text-sm text-foreground">{{ selectedReport.strengths?.join('; ') }}</p>
                  </section>
                }
                @if (selectedReport.weaknesses?.length) {
                  <section>
                    <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Areas of Improvement</h3>
                    <p class="text-sm text-foreground">{{ selectedReport.weaknesses?.join('; ') }}</p>
                  </section>
                }
                @if (selectedReport.areasToDevelop?.length) {
                  <section>
                    <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Development Priorities</h3>
                    <p class="text-sm text-foreground">{{ selectedReport.areasToDevelop?.join('; ') }}</p>
                  </section>
                }
                @if (selectedReport.recommendations) {
                  <section>
                    <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Recommendations</h3>
                    <p class="text-sm text-foreground whitespace-pre-line">{{ selectedReport.recommendations }}</p>
                  </section>
                }
              </div>
            </div>
          </div>
        }
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
          <h3 class="text-base font-semibold text-foreground">No reports yet</h3>
          <p class="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            When a mentorship period ends, you should submit a formal report. It will be shared with the mentee and verified by the admin to release your escrow payment.
          </p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorReportsPageComponent implements OnInit, OnDestroy {
  private readonly reports = inject(ReportsFacade);
  private readonly auth = inject(AuthFacade);
  private readonly mentorData = inject(MentorFacade);
  private readonly userSvc = inject(UsersFacade);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly RATING_SCALE_MAX = RATING_SCALE_MAX;
  reportsList: ReportWithMenteeName[] = [];
  selectedReport: ReportWithMenteeName | null = null;
  searchQuery = '';
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;

  ngOnInit(): void {
    combineLatest([this.reports.menteeReports$, this.mentorData.data$, this.auth.currentUser$]).pipe(
      map(([allReports, mentorD, user]) => {
        if (!user) return [];
        const myReports = allReports.filter((r) => r.mentorId === user.id);
        return myReports.map((r) => ({
          ...r,
          menteeName: mentorD.myMentees.find((m) => String(m.id) === r.menteeId)?.name
            ?? this.userSvc.getById(r.menteeId)?.name ?? `Mentee #${r.menteeId}`,
        }));
      }),
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

  openDetails(report: ReportWithMenteeName): void {
    this.selectedReport = report;
    this.cdr.markForCheck();
  }

  closeDetails(): void {
    this.selectedReport = null;
    this.cdr.markForCheck();
  }

  truncate(value: string, max = 100): string {
    if (!value) return '';
    return value.length > max ? `${value.slice(0, max).trim()}...` : value;
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

  reviewLabel(report: MenteeReport): string {
    const s = report.adminReviewStatus ?? 'pending';
    if (s === 'approved') return 'Approved';
    if (s === 'rejected') return 'Rejected';
    return 'Pending review';
  }

  reviewBadgeClass(report: MenteeReport): string {
    const s = report.adminReviewStatus ?? 'pending';
    if (s === 'approved') return 'bg-green-100 text-green-700';
    if (s === 'rejected') return 'bg-destructive/10 text-destructive';
    return 'bg-amber-100 text-amber-700';
  }
}
