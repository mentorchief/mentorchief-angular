import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { selectAuthUserId } from '../../auth/store/auth.selectors';
import { Store } from '@ngrx/store';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { RATING_SCALE_MAX } from '../../../core/constants';

interface ReportRow {
  id: number;
  menteeId: string;
  mentorId: string;
  mentorName: string;
  menteeName: string;
  createdAt: string;
  summary: string;
  rating: number | null;
  behaviour: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  areasToDevelop: string[] | null;
  recommendations: string | null;
}

const PAGE_SIZE = 10;

@Component({
  selector: 'mc-mentor-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, RouterLink, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl font-semibold text-foreground">Mentorship Reports</h1>
        <p class="text-muted-foreground mt-1.5 text-sm">Reports you have submitted at the end of each mentorship.</p>
      </div>

      <!-- Search & Filters -->
      <div class="bg-card rounded-lg border border-border overflow-hidden">
        <div class="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <input
            type="text"
            [ngModel]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search by mentee name or summary..."
            class="min-w-[220px] flex-1 max-w-md px-4 py-2 bg-input-background border border-border rounded-md text-sm"
          />
          <select
            [ngModel]="filterRating"
            (ngModelChange)="onFilterRatingChange($event)"
            class="px-4 py-2 bg-input-background border border-border rounded-md text-sm"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
          </select>
        </div>

        @if (loading) {
          <div class="p-10 text-center text-muted-foreground text-sm">Loading reports...</div>
        } @else if (reports.length === 0) {
          <div class="p-10 text-center">
            <div class="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-5">
              <fa-icon [icon]="['fas', 'file-lines']" class="text-xl text-muted-foreground" />
            </div>
            <h3 class="text-base font-semibold text-foreground">No reports found</h3>
            <p class="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              When you end a mentorship, you can submit a formal report. Try adjusting your search or filters.
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-muted/50">
                <tr>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentee</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Date Submitted</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Rating</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Summary</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (report of reports; track report.id) {
                  <tr class="border-b border-border last:border-0 hover:bg-muted/30">
                    <td class="px-5 py-4">
                      <a
                        [routerLink]="['/dashboard/mentor/mentee-reports', report.menteeId]"
                        [queryParams]="{ name: report.menteeName }"
                        class="text-sm font-medium text-primary hover:underline"
                      >
                        {{ report.menteeName }}
                      </a>
                    </td>
                    <td class="px-5 py-4 text-sm text-muted-foreground">{{ formatDate(report.createdAt) }}</td>
                    <td class="px-5 py-4">
                      @if (report.rating != null) {
                        <div class="flex items-center gap-1">
                          @for (star of [1,2,3,4,5]; track star) {
                            <fa-icon [icon]="['fas', 'star']" class="w-3.5 h-3.5" [class.text-amber-500]="star <= report.rating!" [class.text-gray-300]="star > report.rating!" />
                          }
                          <span class="text-xs text-muted-foreground ml-1">{{ report.rating }}/{{ RATING_SCALE_MAX }}</span>
                        </div>
                      } @else {
                        <span class="text-xs text-muted-foreground">N/A</span>
                      }
                    </td>
                    <td class="px-5 py-4 text-sm text-foreground max-w-[250px] truncate">{{ report.summary }}</td>
                    <td class="px-5 py-4">
                      <button
                        type="button"
                        (click)="openDetailModal(report)"
                        class="px-3 py-1.5 border border-border text-foreground rounded-md text-sm hover:bg-muted"
                      >
                        Details
                      </button>
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
    </div>

    <!-- Detail Modal -->
    @if (selectedReport) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div class="absolute inset-0 bg-foreground/50 backdrop-blur-sm" (click)="closeDetailModal()"></div>
        <div class="relative bg-card rounded-lg shadow-xl border border-border max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" (click)="$event.stopPropagation()">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-xs uppercase tracking-wider text-muted-foreground font-medium">Mentorship Report</p>
              <h2 class="text-lg font-semibold text-foreground mt-1">Report for {{ selectedReport.menteeName }}</h2>
              <p class="text-sm text-muted-foreground mt-0.5">{{ formatDate(selectedReport.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-3">
              @if (selectedReport.rating != null) {
                <div class="flex items-center gap-1">
                  @for (star of [1,2,3,4,5]; track star) {
                    <fa-icon [icon]="['fas', 'star']" class="w-4 h-4" [class.text-amber-500]="star <= selectedReport.rating!" [class.text-gray-300]="star > selectedReport.rating!" />
                  }
                  <span class="text-sm font-medium text-foreground ml-1.5">{{ selectedReport.rating }}/{{ RATING_SCALE_MAX }}</span>
                </div>
              }
              <button type="button" (click)="closeDetailModal()" class="text-muted-foreground hover:text-foreground">
                <fa-icon [icon]="['fas', 'xmark']" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="space-y-5">
            <section>
              <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Summary</h3>
              <p class="text-sm text-foreground leading-relaxed whitespace-pre-line">{{ selectedReport.summary }}</p>
            </section>

            @if (selectedReport.behaviour) {
              <section class="pt-4 border-t border-border">
                <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Behaviour & Professionalism</h3>
                <p class="text-sm text-foreground leading-relaxed">{{ selectedReport.behaviour }}</p>
              </section>
            }

            <div class="grid sm:grid-cols-3 gap-5 pt-4 border-t border-border">
              @if (selectedReport.strengths?.length) {
                <section>
                  <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Strengths</h3>
                  <ul class="space-y-1.5">
                    @for (s of selectedReport.strengths; track s) {
                      <li class="text-sm text-foreground flex gap-2"><span class="text-muted-foreground">•</span>{{ s }}</li>
                    }
                  </ul>
                </section>
              }
              @if (selectedReport.weaknesses?.length) {
                <section>
                  <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Areas of Improvement</h3>
                  <ul class="space-y-1.5">
                    @for (w of selectedReport.weaknesses; track w) {
                      <li class="text-sm text-foreground flex gap-2"><span class="text-muted-foreground">•</span>{{ w }}</li>
                    }
                  </ul>
                </section>
              }
              @if (selectedReport.areasToDevelop?.length) {
                <section>
                  <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Development Priorities</h3>
                  <ul class="space-y-1.5">
                    @for (a of selectedReport.areasToDevelop; track a) {
                      <li class="text-sm text-foreground flex gap-2"><span class="text-muted-foreground">•</span>{{ a }}</li>
                    }
                  </ul>
                </section>
              }
            </div>

            @if (selectedReport.recommendations) {
              <section class="pt-4 border-t border-border">
                <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Recommendations</h3>
                <p class="text-sm text-foreground leading-relaxed whitespace-pre-line">{{ selectedReport.recommendations }}</p>
              </section>
            }
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorReportsPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly authApi = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  readonly RATING_SCALE_MAX = RATING_SCALE_MAX;
  readonly pageSize = PAGE_SIZE;

  reports: ReportRow[] = [];
  totalCount = 0;
  currentPage = 1;
  searchQuery = '';
  filterRating = '';
  loading = false;
  selectedReport: ReportRow | null = null;

  private mentorId: string | null = null;

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.currentPage = 1;
      this.fetchReports();
    });

    this.store.select(selectAuthUserId).pipe(takeUntil(this.destroy$)).subscribe((id) => {
      if (id && id !== this.mentorId) {
        this.mentorId = id;
        this.fetchReports();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.search$.next(value);
  }

  onFilterRatingChange(value: string): void {
    this.filterRating = value;
    this.currentPage = 1;
    this.fetchReports();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.fetchReports();
  }

  openDetailModal(report: ReportRow): void {
    this.selectedReport = report;
    this.cdr.markForCheck();
  }

  closeDetailModal(): void {
    this.selectedReport = null;
    this.cdr.markForCheck();
  }

  private fetchReports(): void {
    if (!this.mentorId) return;
    this.loading = true;
    this.cdr.markForCheck();

    const ratingMin = this.filterRating ? Number(this.filterRating) : undefined;

    this.authApi.searchMentorReports(this.mentorId, {
      query: this.searchQuery || undefined,
      ratingMin,
      page: this.currentPage,
      pageSize: this.pageSize,
    }).pipe(takeUntil(this.destroy$)).subscribe(({ data, count }) => {
      this.reports = data.map((r, idx): ReportRow => ({
        id: idx + 1,
        menteeId: r.mentee_id,
        mentorId: r.mentor_id,
        mentorName: r.mentor_name,
        menteeName: r.mentee_profile?.name ?? `Mentee`,
        createdAt: r.created_at,
        summary: r.summary,
        rating: r.rating,
        behaviour: r.behaviour,
        strengths: r.strengths,
        weaknesses: r.weaknesses,
        areasToDevelop: r.areas_to_develop,
        recommendations: r.recommendations,
      }));
      this.totalCount = count;
      this.loading = false;
      this.cdr.markForCheck();
    });
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
}
