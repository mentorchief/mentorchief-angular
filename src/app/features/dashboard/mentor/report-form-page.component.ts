import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectMyMentees } from '../store/dashboard.selectors';
import { addMenteeReport } from '../store/dashboard.actions';
import { ToastService } from '../../../shared/services/toast.service';
import type { MenteeListItem } from '../../../core/models/dashboard.model';

@Component({
  selector: 'mc-mentor-report-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <a [routerLink]="['/dashboard/mentor/my-mentees']" class="text-sm text-primary hover:underline no-underline">← My Mentees</a>
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
            <label class="block text-sm font-medium text-foreground mb-1.5">Rating (1–5)</label>
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
          </section>

          <section>
            <label for="behaviour" class="block text-sm font-medium text-foreground mb-1.5">Behaviour &amp; Professionalism</label>
            <textarea
              id="behaviour"
              formControlName="behaviour"
              rows="3"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Assessment of professionalism and conduct."
            ></textarea>
          </section>

          <section>
            <label for="strengths" class="block text-sm font-medium text-foreground mb-1.5">Strengths</label>
            <textarea
              id="strengths"
              formControlName="strengths"
              rows="3"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="One strength per line."
            ></textarea>
          </section>

          <section>
            <label for="weaknesses" class="block text-sm font-medium text-foreground mb-1.5">Areas of Improvement</label>
            <textarea
              id="weaknesses"
              formControlName="weaknesses"
              rows="3"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="One point per line."
            ></textarea>
          </section>

          <section>
            <label for="areasToDevelop" class="block text-sm font-medium text-foreground mb-1.5">Development Priorities</label>
            <textarea
              id="areasToDevelop"
              formControlName="areasToDevelop"
              rows="3"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="One priority per line."
            ></textarea>
          </section>

          <section>
            <label for="recommendations" class="block text-sm font-medium text-foreground mb-1.5">Recommendations</label>
            <textarea
              id="recommendations"
              formControlName="recommendations"
              rows="3"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Next steps or recommendations for future mentors."
            ></textarea>
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
export class MentorReportFormPageComponent implements OnInit {
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  mentee: MenteeListItem | null = null;
  submitting = false;

  form: FormGroup = this.fb.group({
    summary: ['', Validators.required],
    rating: [null as number | null],
    behaviour: [''],
    strengths: [''],
    weaknesses: [''],
    areasToDevelop: [''],
    recommendations: [''],
  });

  ngOnInit(): void {
    const menteeId = this.route.snapshot.paramMap.get('menteeId');
    const id = menteeId ? parseInt(menteeId, 10) : NaN;
    if (Number.isNaN(id)) {
      this.router.navigate(['/dashboard/mentor/my-mentees']);
      return;
    }
    this.store
      .select(selectMyMentees)
      .pipe(take(1))
      .subscribe((list) => {
        const m = list.find((x) => x.id === id);
        if (!m || m.status !== 'active') {
          this.router.navigate(['/dashboard/mentor/my-mentees']);
          return;
        }
        this.mentee = m;
        this.cdr.markForCheck();
      });
  }

  onSubmit(): void {
    const m = this.mentee;
    if (!m || this.form.invalid) return;
    this.submitting = true;
    const v = this.form.getRawValue();
    const toLines = (s: string) =>
      s
        ? s
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
        : undefined;
    this.store.dispatch(
      addMenteeReport({
        menteeId: m.id,
        mentorId: 1,
        mentorName: 'Mentor',
        summary: v.summary,
        rating: v.rating ?? undefined,
        behaviour: v.behaviour || undefined,
        strengths: toLines(v.strengths),
        weaknesses: toLines(v.weaknesses),
        areasToDevelop: toLines(v.areasToDevelop),
        recommendations: v.recommendations || undefined,
      }),
    );
    this.toast.success(`Report saved and ${m.name}'s mentorship marked as completed.`);
    this.router.navigate(['/dashboard/mentor/my-mentees']);
  }
}
