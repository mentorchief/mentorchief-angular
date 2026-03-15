import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectActiveMentorsList, selectPastMentorsWithReviews } from '../store/dashboard.selectors';
import { submitMentorReview } from '../store/dashboard.actions';
import { ToastService } from '../../../shared/services/toast.service';
import type { PastMentorSummary, ActiveMentorSummary, MentorReview, MenteeReport } from '../../../core/models/dashboard.model';
import { RATING_SCALE_MAX } from '../../../core/constants';
import { PaginationComponent } from '../../../shared/components/pagination.component';

type PastWithReview = PastMentorSummary & { review?: MentorReview; report?: MenteeReport };

const ACTIVE_PAGE_SIZE = 5;
const PAST_PAGE_SIZE = 5;

@Component({
  selector: 'mc-my-mentors-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, RouterLink, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">My Mentors</h1>
        <p class="text-muted-foreground mt-1">Manage your mentorship relationships</p>
      </div>

      <!-- Active Mentorships -->
      <div class="mb-8">
        <h2 class="text-lg text-foreground mb-4">Active Mentorships</h2>
        <input
          type="text"
          [ngModel]="activeSearchQuery"
          (ngModelChange)="onActiveSearchChange($event)"
          placeholder="Search by name, title, company..."
          class="mb-4 w-full max-w-md px-4 py-2 bg-input-background border border-border rounded-md text-sm"
        />
        <div class="grid gap-4">
          @for (mentor of activeMentorsPaginated; track mentor.id) {
            <div class="bg-card rounded-lg border border-border p-5">
              <div class="flex items-start gap-4">
                <img
                  [src]="mentor.image"
                  [alt]="mentor.name"
                  class="w-16 h-16 rounded-lg object-cover"
                />
                <div class="flex-1">
                  <div class="flex items-start justify-between">
                    <div>
                      <h3 class="text-foreground font-medium">{{ mentor.name }}</h3>
                      <p class="text-muted-foreground text-sm">{{ mentor.title }} at {{ mentor.company }}</p>
                    </div>
                    <span class="px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs">Active</span>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-4 text-sm">
                    <div class="flex items-center gap-1.5 text-muted-foreground">
                      <fa-icon [icon]="['fas', 'calendar']" class="w-4 h-4" />
                      <span>Started {{ mentor.startDate }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-muted-foreground">
                      <fa-icon [icon]="['fas', 'dollar-sign']" class="w-4 h-4" />
                      <span>\${{ mentor.price }}/month</span>
                    </div>
                  </div>
                  <div class="mt-4 flex gap-3">
                    <a
                      [routerLink]="['/mentor', mentor.id]"
                      class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 no-underline"
                    >
                      View Profile
                    </a>
                    <a
                      routerLink="/dashboard/mentee/messages"
                      class="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-muted no-underline inline-block"
                    >
                      Message
                    </a>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
        @if (activeMentorsFiltered.length > activePageSize) {
          <div class="mt-4">
            <mc-pagination
[totalItems]="activeMentorsFiltered.length"
            [pageSize]="activePageSize"
            [currentPage]="activePage"
            (pageChange)="onActivePageChange($event)"
            />
          </div>
        }
      </div>

      <!-- Past Mentorships -->
      <div>
        <h2 class="text-lg text-foreground mb-4">Past Mentorships</h2>
        <p class="text-muted-foreground text-sm mb-4">Leave a review and rating for mentors after your subscription has ended.</p>
        <input
          type="text"
          [ngModel]="pastSearchQuery"
          (ngModelChange)="onPastSearchChange($event)"
          placeholder="Search by name or title..."
          class="mb-4 w-full max-w-md px-4 py-2 bg-input-background border border-border rounded-md text-sm"
        />
        @if (pastMentorsFiltered.length === 0) {
          <div class="bg-muted/50 rounded-lg p-8 text-center">
            <p class="text-muted-foreground">No past mentorships yet.</p>
          </div>
        } @else {
          <div class="grid gap-4">
            @for (item of pastMentorsPaginated; track item.id) {
              <div class="bg-card rounded-lg border border-border p-5">
                <div class="flex items-start gap-4">
                  <img
                    [src]="item.image"
                    [alt]="item.name"
                    class="w-14 h-14 rounded-lg object-cover grayscale"
                  />
                  <div class="flex-1">
                    <div class="flex items-start justify-between">
                      <div>
                        <h3 class="text-foreground font-medium">{{ item.name }}</h3>
                        <p class="text-muted-foreground text-sm">{{ item.title }}</p>
                      </div>
                      <span class="px-2.5 py-1 bg-muted text-muted-foreground rounded-md text-xs">Completed</span>
                    </div>
                    <p class="text-muted-foreground text-sm mt-2">
                      {{ item.startDate }} - {{ item.endDate }}
                    </p>
                    @if (item.review) {
                      <div class="mt-3 p-3 bg-muted/50 rounded-md">
                        <div class="flex items-center gap-1 text-amber-500">
                          @for (star of [1,2,3,4,5]; track star) {
                            <fa-icon [icon]="['fas', star <= item.review!.rating ? 'star' : 'star']" class="w-4 h-4" [class.text-amber-500]="star <= item.review!.rating" [class.text-muted-foreground]="star > item.review!.rating" />
                          }
                        </div>
                        <p class="text-foreground text-sm mt-1">You rated {{ item.review.rating }}/{{ RATING_SCALE_MAX }}</p>
                        @if (item.review.comment) {
                          <p class="text-muted-foreground text-sm mt-1">{{ item.review.comment }}</p>
                        }
                      </div>
                    }
                    @if (item.report) {
                      <div class="mt-3 rounded-lg border border-border bg-muted/30 overflow-hidden">
                        <div class="px-4 py-3 border-b border-border">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mentor's Report</span>
                            @if (item.report.rating != null) {
                              <div class="flex items-center gap-1 text-muted-foreground">
                                @for (star of [1,2,3,4,5]; track star) {
                                  <fa-icon [icon]="['fas', 'star']" class="w-3.5 h-3.5" [class.text-foreground]="star <= item.report!.rating!" [class.opacity-40]="star > item.report!.rating!" />
                                }
                                <span class="text-xs font-medium text-foreground ml-1">{{ item.report.rating }}/{{ RATING_SCALE_MAX }}</span>
                              </div>
                            }
                          </div>
                        </div>
                        <div class="p-4 space-y-3">
                          <p class="text-sm text-foreground leading-relaxed">{{ item.report.summary }}</p>
                          @if (item.report.behaviour) {
                            <p class="text-xs text-muted-foreground leading-relaxed">
                              <span class="font-medium text-foreground uppercase tracking-wider">Behaviour:</span>
                              {{ item.report.behaviour }}
                            </p>
                          }
                          @if ((item.report.weaknesses?.length ?? 0) > 0 || (item.report.areasToDevelop?.length ?? 0) > 0) {
                            <div class="pt-3 border-t border-border text-xs text-muted-foreground space-y-1.5">
                              @if (item.report.weaknesses?.length) {
                                <p><span class="font-medium text-foreground uppercase tracking-wider">Areas of improvement:</span> {{ (item.report.weaknesses ?? []).slice(0, 2).join('; ') }}</p>
                              }
                              @if (item.report.areasToDevelop?.length) {
                                <p><span class="font-medium text-foreground uppercase tracking-wider">Development priorities:</span> {{ (item.report.areasToDevelop ?? []).slice(0, 2).join('; ') }}</p>
                              }
                            </div>
                          }
                          <a routerLink="/dashboard/mentee/reports" class="text-xs font-medium text-foreground hover:underline no-underline pt-1 inline-block">View full report</a>
                        </div>
                      </div>
                    } @else {
                      <button
                        type="button"
                        (click)="openReviewModal(item)"
                        class="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
                      >
                        <fa-icon [icon]="['fas', 'star']" class="w-4 h-4 mr-1.5" /> Leave review & rating
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
          @if (pastMentorsFiltered.length > pastPageSize) {
            <div class="mt-4">
              <mc-pagination
                [totalItems]="pastMentorsFiltered.length"
                [pageSize]="pastPageSize"
                [currentPage]="pastPage"
                (pageChange)="onPastPageChange($event)"
              />
            </div>
          }
        }
      </div>

      <!-- Leave Review Modal -->
      @if (reviewModalMentor) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" (click)="closeReviewModal()">
          <div
            class="bg-card rounded-lg border border-border shadow-lg w-full max-w-md p-6"
            (click)="$event.stopPropagation()"
          >
            <h3 class="text-lg font-medium text-foreground">Leave a review for {{ reviewModalMentor.name }}</h3>
            <p class="text-muted-foreground text-sm mt-1">Your rating and review help other mentees.</p>
            <div class="mt-4">
              <span class="block text-sm font-medium text-foreground mb-2">Rating</span>
              <div class="flex gap-1">
                @for (star of [1,2,3,4,5]; track star) {
                  <button
                    type="button"
                    (click)="setReviewRating(star)"
                    class="p-1 rounded hover:opacity-80 transition-opacity"
                  >
                    <fa-icon
                      [icon]="['fas', 'star']"
                      class="w-8 h-8"
                      [class.text-amber-500]="star <= reviewRating"
                      [class.text-muted-foreground]="star > reviewRating"
                    />
                  </button>
                }
              </div>
            </div>
            <div class="mt-4">
              <label for="review-comment" class="block text-sm font-medium text-foreground mb-2">Review (optional)</label>
              <textarea
                id="review-comment"
                [value]="reviewComment"
                (input)="onReviewCommentInput($event)"
                placeholder="Share your experience with this mentor..."
                rows="4"
                class="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
              ></textarea>
            </div>
            <div class="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                (click)="closeReviewModal()"
                class="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="submitReview()"
                [disabled]="reviewRating < 1"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
              >
                Submit review
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Find More Mentors CTA -->
      <div class="mt-8 bg-primary/5 rounded-lg p-6 border border-primary/10">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-foreground font-medium">Looking for more guidance?</h3>
            <p class="text-muted-foreground text-sm mt-1">Browse our network of expert mentors</p>
          </div>
          <a
            routerLink="/browse"
            class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 no-underline"
          >
            Find Mentors
          </a>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyMentorsPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly RATING_SCALE_MAX = RATING_SCALE_MAX;
  readonly activeMentors$ = this.store.select(selectActiveMentorsList);
  readonly pastMentorsWithReviews$ = this.store.select(selectPastMentorsWithReviews);
  activeMentorsList: ActiveMentorSummary[] = [];
  pastMentorsList: PastWithReview[] = [];
  activeSearchQuery = '';
  pastSearchQuery = '';
  readonly activePageSize = ACTIVE_PAGE_SIZE;
  readonly pastPageSize = PAST_PAGE_SIZE;
  activePage = 1;
  pastPage = 1;

  reviewModalMentor: PastMentorSummary | null = null;
  reviewRating = 0;
  reviewComment = '';

  ngOnInit(): void {
    this.activeMentors$.pipe(takeUntil(this.destroy$)).subscribe((list) => {
      this.activeMentorsList = list;
      this.cdr.markForCheck();
    });
    this.pastMentorsWithReviews$.pipe(takeUntil(this.destroy$)).subscribe((list) => {
      this.pastMentorsList = list;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get activeMentorsFiltered(): ActiveMentorSummary[] {
    const list = this.activeMentorsList;
    const q = this.activeSearchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.company && m.company.toLowerCase().includes(q))
    );
  }

  get pastMentorsFiltered(): PastWithReview[] {
    const list = this.pastMentorsList;
    const q = this.pastSearchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter((m) => m.name.toLowerCase().includes(q) || (m.title && m.title.toLowerCase().includes(q)));
  }

  get activeMentorsPaginated(): ActiveMentorSummary[] {
    const list = this.activeMentorsFiltered;
    const start = (this.activePage - 1) * this.activePageSize;
    return list.slice(start, start + this.activePageSize);
  }

  get pastMentorsPaginated(): PastWithReview[] {
    const list = this.pastMentorsFiltered;
    const start = (this.pastPage - 1) * this.pastPageSize;
    return list.slice(start, start + this.pastPageSize);
  }

  onActiveSearchChange(value: string): void {
    this.activeSearchQuery = value;
    this.activePage = 1;
    this.cdr.markForCheck();
  }

  onActivePageChange(page: number): void {
    this.activePage = page;
    this.cdr.markForCheck();
  }

  onPastSearchChange(value: string): void {
    this.pastSearchQuery = value;
    this.pastPage = 1;
    this.cdr.markForCheck();
  }

  onPastPageChange(page: number): void {
    this.pastPage = page;
    this.cdr.markForCheck();
  }

  openReviewModal(mentor: PastMentorSummary): void {
    this.reviewModalMentor = mentor;
    this.reviewRating = 0;
    this.reviewComment = '';
    this.cdr.markForCheck();
  }

  closeReviewModal(): void {
    this.reviewModalMentor = null;
    this.cdr.markForCheck();
  }

  setReviewRating(rating: number): void {
    this.reviewRating = rating;
    this.cdr.markForCheck();
  }

  onReviewCommentInput(event: Event): void {
    this.reviewComment = (event.target as HTMLTextAreaElement)?.value ?? '';
    this.cdr.markForCheck();
  }

  submitReview(): void {
    const mentor = this.reviewModalMentor;
    const rating = this.reviewRating;
    if (!mentor || rating < 1) return;
    this.store.dispatch(submitMentorReview({ mentorId: mentor.id, rating, comment: this.reviewComment.trim() }));
    this.toast.success(`Thanks! Your review for ${mentor.name} has been submitted.`);
    this.closeReviewModal();
  }
}
