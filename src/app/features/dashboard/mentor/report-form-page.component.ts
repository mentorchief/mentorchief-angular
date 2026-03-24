import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { forkJoin, of, take, Subject, switchMap } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import type { AppState } from '../../../store/app.state';
import { selectMyMentees } from '../store/dashboard.selectors';
import { selectAuthUser } from '../../auth/store/auth.selectors';
import { addMenteeReport, markMenteeCompleted } from '../store/dashboard.actions';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthApiService } from '../../../core/services/auth-api.service';
import type { MenteeListItem } from '../../../core/models/dashboard.model';
import { UserRole } from '../../../core/models/user.model';
import { ROUTES } from '../../../core/routes';

@Component({
  selector: 'mc-mentor-report-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <a [routerLink]="ROUTES.mentor.myMentees" class="text-sm text-primary hover:underline no-underline">← My Mentees</a>
        <h1 class="text-2xl lg:text-3xl font-semibold text-foreground mt-2">End Mentorship & Submit Report</h1>
        @if (mentee) {
          <p class="text-muted-foreground mt-1.5 text-sm">Write a formal report for {{ mentee.name }}. This will be shared with the mentee and may be shared with future mentors.</p>
        }
      </div>

      @if (mentee) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
          <section>
            <label for="summary" class="block text-sm font-medium text-foreground mb-1.5">Summary <span class="text-destructive">*</span></label>
            <textarea
              id="summary"
              formControlName="summary"
              rows="4"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Overall summary of the mentorship and progress made."
            ></textarea>
            @if (form.get('summary')?.invalid && form.get('summary')?.touched) {
              <p class="text-destructive text-xs mt-1">Summary is required.</p>
            }
          </section>

          <section>
            <label class="block text-sm font-medium text-foreground mb-1.5">Rating (1–5) <span class="text-destructive">*</span></label>
            <div class="flex gap-2">
              @for (star of [1,2,3,4,5]; track star) {
                <button
                  type="button"
                  (click)="form.patchValue({ rating: star })"
                  class="w-10 h-10 rounded-md border text-sm font-medium transition-colors"
                  [class.border-primary]="(form.get('rating')?.value ?? 0) >= star"
                  [class.bg-primary]="(form.get('rating')?.value ?? 0) >= star"
                  [class.text-primary-foreground]="(form.get('rating')?.value ?? 0) >= star"
                  [class.border-border]="(form.get('rating')?.value ?? 0) < star"
                  [class.text-muted-foreground]="(form.get('rating')?.value ?? 0) < star"
                >
                  {{ star }}
                </button>
              }
            </div>
            @if (form.get('rating')?.invalid && form.get('rating')?.touched) {
              <p class="text-destructive text-xs mt-1">Rating is required.</p>
            }
          </section>

          <section>
            <label for="behaviour" class="block text-sm font-medium text-foreground mb-1.5">Behaviour &amp; Professionalism <span class="text-destructive">*</span></label>
            <textarea
              id="behaviour"
              formControlName="behaviour"
              rows="3"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Assessment of professionalism and conduct."
            ></textarea>
            @if (form.get('behaviour')?.invalid && form.get('behaviour')?.touched) {
              <p class="text-destructive text-xs mt-1">Behaviour is required.</p>
            }
          </section>

          <section>
            <label for="strengths" class="block text-sm font-medium text-foreground mb-1.5">Strengths <span class="text-destructive">*</span></label>
            <textarea
              id="strengths"
              formControlName="strengths"
              rows="3"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="One strength per line."
            ></textarea>
            @if (form.get('strengths')?.invalid && form.get('strengths')?.touched) {
              <p class="text-destructive text-xs mt-1">Strengths are required.</p>
            }
          </section>

          <section>
            <label for="weaknesses" class="block text-sm font-medium text-foreground mb-1.5">Areas of Improvement <span class="text-destructive">*</span></label>
            <textarea
              id="weaknesses"
              formControlName="weaknesses"
              rows="3"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="One point per line."
            ></textarea>
            @if (form.get('weaknesses')?.invalid && form.get('weaknesses')?.touched) {
              <p class="text-destructive text-xs mt-1">Areas of improvement are required.</p>
            }
          </section>

          <section>
            <label for="areasToDevelop" class="block text-sm font-medium text-foreground mb-1.5">Development Priorities <span class="text-destructive">*</span></label>
            <textarea
              id="areasToDevelop"
              formControlName="areasToDevelop"
              rows="3"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="One priority per line."
            ></textarea>
            @if (form.get('areasToDevelop')?.invalid && form.get('areasToDevelop')?.touched) {
              <p class="text-destructive text-xs mt-1">Development priorities are required.</p>
            }
          </section>

          <section>
            <label for="recommendations" class="block text-sm font-medium text-foreground mb-1.5">Recommendations <span class="text-destructive">*</span></label>
            <textarea
              id="recommendations"
              formControlName="recommendations"
              rows="3"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Next steps or recommendations for future mentors."
            ></textarea>
            @if (form.get('recommendations')?.invalid && form.get('recommendations')?.touched) {
              <p class="text-destructive text-xs mt-1">Recommendations are required.</p>
            }
          </section>

          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              [disabled]="form.invalid || submitting"
              class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {{ submitting ? 'Submitting…' : 'Submit Report & End Mentorship' }}
            </button>
            <a
              [routerLink]="['/dashboard/mentor/my-mentees']"
              class="px-5 py-2.5 border border-border text-foreground rounded-md text-sm font-medium hover:bg-muted no-underline inline-block"
            >
              Cancel
            </a>
          </div>
        </form>
      } @else {
        <p class="text-muted-foreground">Loading…</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorReportFormPageComponent implements OnInit, OnDestroy {
  readonly ROUTES = ROUTES;
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly authApi = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();
  mentee: MenteeListItem | null = null;
  mentorUserId: string | null = null;
  mentorName: string = '';
  submitting = false;

  form: FormGroup = this.fb.group({
    summary: ['', Validators.required],
    rating: [null as number | null, Validators.required],
    behaviour: ['', Validators.required],
    strengths: ['', Validators.required],
    weaknesses: ['', Validators.required],
    areasToDevelop: ['', Validators.required],
    recommendations: ['', Validators.required],
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.store.select(selectAuthUser).pipe(take(1)).subscribe((user) => {
      this.mentorUserId = user?.id ?? null;
      this.mentorName = user?.name ?? '';
    });
    const menteeId = this.route.snapshot.paramMap.get('menteeId');
    const id = menteeId ? parseInt(menteeId, 10) : NaN;
    if (Number.isNaN(id)) {
      this.router.navigate([ROUTES.mentor.myMentees]);
      return;
    }
    this.store
      .select(selectMyMentees)
      .pipe(take(1))
      .subscribe((list) => {
        const m = list.find((x) => x.id === id);
        if (!m || m.status !== 'active') {
          this.router.navigate([ROUTES.mentor.myMentees]);
          return;
        }
        this.mentee = m;
        this.cdr.markForCheck();
      });
  }

  onSubmit(): void {
    const m = this.mentee;
    if (!m || this.form.invalid || !this.mentorUserId) return;
    this.submitting = true;
    const v = this.form.getRawValue();
    const toLines = (s: string): string[] =>
      s ? s.split('\n').map((l) => l.trim()).filter(Boolean) : [];

    // We need the actual mentee UUID (not the numeric list id).
    // The mentee list uses numeric ids but the mentee's Supabase uuid is in the email field
    // or we look it up from conversations. For now we store the mentee UUID via the report form.
    // The mentee id used when submitting is derived from sessions loaded from Supabase.
    // We resolve by finding the mentee UUID from the mentorships (stored in myMentees email field).
    const menteeUuid = m.email; // email field stores the Supabase UUID after Supabase integration

    this.authApi.insertMenteeReport({
      menteeId: menteeUuid || String(m.id),
      mentorId: this.mentorUserId,
      mentorName: this.mentorName,
      summary: v.summary,
      rating: v.rating ?? 0,
      behaviour: v.behaviour ?? '',
      strengths: toLines(v.strengths),
      weaknesses: toLines(v.weaknesses),
      areasToDevelop: toLines(v.areasToDevelop),
      recommendations: v.recommendations ?? '',
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (reportRow) => {
        this.store.dispatch(
          addMenteeReport({
            menteeId: menteeUuid || String(m.id),
            mentorId: this.mentorUserId ?? '',
            mentorName: this.mentorName,
            summary: v.summary,
            rating: v.rating ?? undefined,
            behaviour: v.behaviour || undefined,
            strengths: toLines(v.strengths),
            weaknesses: toLines(v.weaknesses),
            areasToDevelop: toLines(v.areasToDevelop),
            recommendations: v.recommendations || undefined,
          }),
        );
        this.store.dispatch(markMenteeCompleted({ menteeId: m.id }));

        // Send notifications: mentee gets notified their report is ready,
        // admins get notified a report was submitted and payment can be released.
        this.sendReportNotifications(menteeUuid || String(m.id), m.name, reportRow.id);

        this.toast.success(`Report saved and ${m.name}'s mentorship marked as completed.`);
        this.router.navigate([ROUTES.mentor.myMentees]);
      },
      error: () => {
        this.submitting = false;
        this.toast.error('Failed to save report. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }

  private sendReportNotifications(menteeUuid: string, menteeName: string, reportId: string): void {
    const mentorId = this.mentorUserId;
    if (!mentorId) return;

    // Notify mentee their report is available
    const notifyMentee$ = this.authApi.createNotification({
      userId: menteeUuid,
      type: 'report_submitted',
      title: 'Your mentorship report is ready',
      body: `${this.mentorName} has submitted your end-of-mentorship report. View it in your Reports section.`,
      metadata: { reportId, mentorId },
    }).pipe(catchError(() => of(null)));

    // Get all admins and notify them
    const notifyAdmins$ = this.authApi.getAllProfiles().pipe(
      catchError(() => of([])),
    );

    forkJoin([notifyMentee$, notifyAdmins$]).pipe(
      switchMap(([, allUsers]) => {
        const admins = allUsers.filter((u) => u.role === UserRole.Admin);
        if (!admins.length) return of(null);
        return forkJoin(admins.map((admin) =>
          this.authApi.createNotification({
            userId: admin.id,
            type: 'report_submitted',
            title: 'Mentorship report submitted',
            body: `${this.mentorName} submitted a report for mentee ${menteeName}. Review and release payment when ready.`,
            metadata: { reportId, mentorId, menteeId: menteeUuid, menteeName },
          }).pipe(catchError(() => of(null))),
        ));
      }),
      catchError(() => of(null)),
      takeUntil(this.destroy$),
    ).subscribe();
  }
}
