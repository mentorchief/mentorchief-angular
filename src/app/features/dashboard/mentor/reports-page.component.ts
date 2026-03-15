import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { RATING_SCALE_MAX } from '../../../core/constants';
import { selectMenteeReportsForCurrentMentor } from '../store/dashboard.selectors';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import type { MenteeReport } from '../../../core/models/dashboard.model';

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
        <div class="space-y-8">
          @for (report of reportsPaginated; track report.id) {
            <article class="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <header class="border-b border-border bg-muted/30 px-6 py-5">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p class="text-xs uppercase tracking-wider text-muted-foreground font-medium">Mentorship Report</p>
                    <h2 class="text-lg font-semibold text-foreground mt-1">Report for {{ report.menteeName }}</h2>
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
                    <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Submitted</span>
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
          <h3 class="text-base font-semibold text-foreground">No reports yet</h3>
          <p class="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            When you end a mentorship from My Mentees, you can submit a formal report. It will be shared with the mentee and visible to their next mentors.
          </p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorReportsPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly RATING_SCALE_MAX = RATING_SCALE_MAX;
  reportsList: ReportWithMenteeName[] = [];
  searchQuery = '';
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;

  ngOnInit(): void {
    this.store
      .select(selectMenteeReportsForCurrentMentor)
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
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
