import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subject, takeUntil } from 'rxjs';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { RATING_SCALE_MAX } from '../../../core/constants';
import type { MenteeReport } from '../../../core/models/dashboard.model';
import { ROUTES } from '../../../core/routes';

@Component({
  selector: 'mc-mentee-reports-page',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8 flex items-center gap-4">
        <a [routerLink]="ROUTES.mentor.myMentees" class="text-muted-foreground hover:text-foreground no-underline">
          <fa-icon [icon]="['fas', 'arrow-left']" class="w-4 h-4" />
        </a>
        <div>
          <h1 class="text-2xl lg:text-3xl font-semibold text-foreground">
            Reports for {{ menteeName || 'Mentee' }}
          </h1>
          <p class="text-muted-foreground mt-1 text-sm">All mentorship reports submitted by previous mentors.</p>
        </div>
      </div>

      @if (loading) {
        <div class="flex items-center justify-center py-16">
          <fa-icon [icon]="['fas', 'circle-notch']" class="text-primary text-2xl animate-spin" />
        </div>
      } @else if (reports.length) {
        <div class="space-y-8">
          @for (report of reports; track report.id) {
            <article class="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <header class="border-b border-border bg-muted/30 px-6 py-5">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p class="text-xs uppercase tracking-wider text-muted-foreground font-medium">Mentorship Report</p>
                    <h2 class="text-lg font-semibold text-foreground mt-1">By {{ report.mentorName }}</h2>
                    <p class="text-sm text-muted-foreground mt-0.5">{{ formatDate(report.createdAt) }}</p>
                  </div>
                  @if (report.rating != null) {
                    <div class="flex items-center gap-1 text-muted-foreground">
                      @for (star of [1,2,3,4,5]; track star) {
                        <fa-icon [icon]="['fas', 'star']" class="w-4 h-4"
                          [class.text-foreground]="star <= report.rating!"
                          [class.opacity-40]="star > report.rating!" />
                      }
                      <span class="text-sm font-medium text-foreground ml-1.5">{{ report.rating }}/{{ RATING_SCALE_MAX }}</span>
                    </div>
                  }
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
      } @else {
        <div class="bg-card rounded-lg border border-border p-10 text-center">
          <div class="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-5">
            <fa-icon [icon]="['fas', 'file-lines']" class="text-xl text-muted-foreground" />
          </div>
          <h3 class="text-base font-semibold text-foreground">No reports yet</h3>
          <p class="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            No previous mentors have submitted a report for this mentee.
          </p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenteeReportsPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly ROUTES = ROUTES;
  readonly RATING_SCALE_MAX = RATING_SCALE_MAX;

  reports: MenteeReport[] = [];
  menteeName = '';
  loading = true;

  ngOnInit(): void {
    const menteeUuid = this.route.snapshot.paramMap.get('menteeUuid') ?? '';
    this.menteeName = this.route.snapshot.queryParamMap.get('name') ?? '';

    if (!menteeUuid) {
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.authApi.getReportsForMentee(menteeUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reports) => {
          this.reports = reports;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return iso;
    }
  }
}
