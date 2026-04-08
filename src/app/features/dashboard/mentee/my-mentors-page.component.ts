import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { map } from 'rxjs';
import { ToastService } from '../../../shared/services/toast.service';
import type { PastMentorSummary, ActiveMentorSummary, MentorReview } from '../../../core/models/dashboard.model';
import { RATING_SCALE_MAX } from '../../../core/constants';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { MenteeFacade } from '../../../core/facades/mentee.facade';
import { ReportsFacade } from '../../../core/facades/reports.facade';
import { MessagingFacade } from '../../../core/facades/messaging.facade';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { UsersFacade } from '../../../core/facades/users.facade';

type PastWithReview = PastMentorSummary & { review?: MentorReview };

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
        <div class="bg-card rounded-lg border border-border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-muted/50">
                <tr>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentor</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Started</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Price</th>
                  <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (mentor of activeMentorsPaginated; track mentor.id) {
                  <tr class="border-b border-border last:border-0 hover:bg-muted/30">
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <img [src]="mentor.image" [alt]="mentor.name" class="w-10 h-10 rounded-md object-cover" />
                        <div>
                          <p class="text-foreground text-sm font-medium">{{ mentor.name }}</p>
                          <p class="text-muted-foreground text-xs">{{ mentor.title }} at {{ mentor.company }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-4">
                      <span class="px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs">Active</span>
                    </td>
                    <td class="px-5 py-4 text-sm text-muted-foreground">{{ mentor.startDate }}</td>
                    <td class="px-5 py-4 text-sm text-foreground">\${{ mentor.price }}/month</td>
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-2">
                        <a
                          [routerLink]="['/mentor', mentor.id]"
                          class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs hover:opacity-90 no-underline"
                        >
                          View Profile
                        </a>
                        <a
                          routerLink="/dashboard/mentee/messages"
                          class="px-3 py-1.5 border border-border text-foreground rounded-md text-xs hover:bg-muted no-underline inline-block"
                        >
                          Message
                        </a>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
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
        <p class="text-muted-foreground text-sm mb-4">Leave a review and rating for mentors after your subscription has ended. Mentor end-of-mentorship reports (with admin approval status) are available in My Reports.</p>
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
          <div class="bg-card rounded-lg border border-border overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-muted/50">
                  <tr>
                    <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentor</th>
                    <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Period</th>
                    <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Review</th>
                    <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of pastMentorsPaginated; track item.id) {
                    <tr class="border-b border-border last:border-0 hover:bg-muted/30">
                      <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                          <img [src]="item.image" [alt]="item.name" class="w-10 h-10 rounded-md object-cover grayscale" />
                          <div>
                            <p class="text-foreground text-sm font-medium">{{ item.name }}</p>
                            <p class="text-muted-foreground text-xs">{{ item.title }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-5 py-4">
                        <span class="px-2.5 py-1 bg-muted text-muted-foreground rounded-md text-xs">Completed</span>
                      </td>
                      <td class="px-5 py-4 text-sm text-muted-foreground">{{ item.startDate }} - {{ item.endDate }}</td>
                      <td class="px-5 py-4 text-sm text-foreground">
                        @if (item.review) {
                          <div class="flex items-center gap-2">
                            <span>You rated {{ item.review.rating }}/{{ RATING_SCALE_MAX }}</span>
                          </div>
                        } @else {
                          <span class="text-muted-foreground">Not submitted</span>
                        }
                      </td>
                      <td class="px-5 py-4">
                        @if (!item.review) {
                          <button
                            type="button"
                            (click)="openReviewModal(item)"
                            class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs hover:opacity-90"
                          >
                            Leave review & rating
                          </button>
                        } @else {
                          <a
                            routerLink="/dashboard/mentee/reports"
                            class="px-3 py-1.5 border border-border text-foreground rounded-md text-xs hover:bg-muted no-underline inline-block"
                          >
                            View mentor reports
                          </a>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
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
  private readonly menteeData = inject(MenteeFacade);
  private readonly reportsSvc = inject(ReportsFacade);
  private readonly messaging = inject(MessagingFacade);
  private readonly auth = inject(AuthFacade);
  private readonly users = inject(UsersFacade);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly RATING_SCALE_MAX = RATING_SCALE_MAX;
  readonly activeMentors$ = combineLatest([
    this.menteeData.data$,
    this.messaging.conversations$,
    this.auth.currentUser$,
    this.users.users$,
  ]).pipe(
    map(([, convs, user, users]) => {
      const mine = user ? convs.filter((c) => c.menteeId === user.id && c.status === 'active') : [];
      const usersById = new Map(users.map((u) => [u.id, u] as const));
      const seen = new Set<string>();
      const list: ActiveMentorSummary[] = [];
      for (const c of mine) {
        if (seen.has(c.mentorName)) continue;
        seen.add(c.mentorName);
        const mentorUser = usersById.get(c.mentorId);
        list.push({
          id: Number(c.mentorProfileId) || 0,
          name: c.mentorName,
          title: mentorUser?.jobTitle ?? 'Mentor',
          company: mentorUser?.company ?? 'Mentorchief',
          image: mentorUser?.avatar ?? ('https://ui-avatars.com/api/?name=' + encodeURIComponent(c.mentorName)),
          startDate: c.subscription?.startDate ?? '-',
          price: c.subscription?.amount ?? 0,
          progress: 0,
        });
      }
      return list;
    }),
  );
  readonly pastMentorsWithReviews$ = combineLatest([
    this.menteeData.data$,
    this.reportsSvc.menteeReviews$,
    this.messaging.conversations$,
    this.auth.currentUser$,
    this.users.users$,
  ]).pipe(
    map(([, reviews, convs, user, users]) => {
      const mine = user ? convs.filter((c) => c.menteeId === user.id && c.status === 'past') : [];
      const usersById = new Map(users.map((u) => [u.id, u] as const));
      const seen = new Set<string>();
      const past: PastWithReview[] = [];
      for (const c of mine) {
        if (seen.has(c.mentorName)) continue;
        seen.add(c.mentorName);
        const mentorUser = usersById.get(c.mentorId);
        const mentorId = String(c.mentorProfileId);
        past.push({
          id: Number(c.mentorProfileId) || 0,
          name: c.mentorName,
          title: mentorUser?.jobTitle ?? 'Mentor',
          image: mentorUser?.avatar ?? ('https://ui-avatars.com/api/?name=' + encodeURIComponent(c.mentorName)),
          startDate: c.subscription?.startDate ?? '-',
          endDate: c.subscription?.validUntil ?? '-',
          review: reviews.find((r) => r.mentorId === mentorId),
        });
      }
      return past;
    }),
  );
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
    this.reportsSvc.submitMentorReview(String(mentor.id), rating, this.reviewComment.trim());
    this.toast.success(`Thanks! Your review for ${mentor.name} has been submitted.`);
    this.closeReviewModal();
  }
}
