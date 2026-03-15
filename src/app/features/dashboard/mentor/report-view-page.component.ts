import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, switchMap } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { RATING_SCALE_MAX } from '../../../core/constants';
import { selectReportById } from '../store/dashboard.selectors';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ROUTES } from '../../../core/routes';

@Component({
  selector: 'mc-mentor-report-view-page',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-6">
        <a [routerLink]="ROUTES.mentor.dashboard" class="text-sm text-primary hover:underline no-underline">← Back to Dashboard</a>
      </div>

      @if (report$ | async; as report) {
        <article class="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <header class="border-b border-border bg-muted/30 px-6 py-5">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-xs uppercase tracking-wider text-muted-foreground font-medium">Mentorship Report</p>
                <h2 class="text-lg font-semibold text-foreground mt-1">Report for {{ report.menteeName }}</h2>
                <p class="text-sm text-muted-foreground mt-0.5">From {{ report.mentorName }} · {{ formatDate(report.createdAt) }}</p>
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
      } @else {
        <div class="bg-card rounded-lg border border-border p-10 text-center">
          <h3 class="text-base font-semibold text-foreground">Report not found</h3>
          <p class="text-sm text-muted-foreground mt-2">This report may have been removed or you may not have access to it.</p>
          <a [routerLink]="ROUTES.mentor.dashboard" class="inline-block mt-4 text-sm text-primary hover:underline">Back to Dashboard</a>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorReportViewPageComponent {
  private readonly store = inject(Store<AppState>);
  private readonly route = inject(ActivatedRoute);

  readonly RATING_SCALE_MAX = RATING_SCALE_MAX;
  readonly ROUTES = ROUTES;
  report$ = this.route.paramMap.pipe(
    map((params) => Number(params.get('reportId'))),
    switchMap((reportId) => this.store.select(selectReportById(reportId))),
  );

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
