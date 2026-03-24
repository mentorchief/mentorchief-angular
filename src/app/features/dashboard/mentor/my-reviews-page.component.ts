import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { selectAuthUserId } from '../../../features/auth/store/auth.selectors';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import type { MentorProfileReview } from '../../../core/models/dashboard.model';

const PAGE_SIZE = 8;

@Component({
  selector: 'mc-mentor-my-reviews-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl font-semibold text-foreground">My Reviews</h1>
        <p class="text-muted-foreground mt-1.5 text-sm">Ratings and feedback left by your mentees after their subscriptions ended.</p>

        @if (reviews.length > 0) {
          <!-- Summary bar -->
          <div class="mt-6 flex flex-wrap items-center gap-6">
            <div class="flex items-center gap-2">
              <fa-icon [icon]="['fas', 'star']" class="text-amber-400 w-5 h-5" />
              <span class="text-2xl font-semibold text-foreground">{{ avgRating }}</span>
              <span class="text-sm text-muted-foreground">average</span>
            </div>
            <div class="text-sm text-muted-foreground">{{ reviews.length }} review{{ reviews.length === 1 ? '' : 's' }}</div>
            <!-- Star distribution -->
            <div class="flex flex-col gap-1">
              @for (star of [5,4,3,2,1]; track star) {
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground w-3">{{ star }}</span>
                  <fa-icon [icon]="['fas', 'star']" class="text-amber-400 w-3 h-3" />
                  <div class="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full bg-amber-400 rounded-full"
                      [style.width.%]="getStarPercent(star)"
                    ></div>
                  </div>
                  <span class="text-xs text-muted-foreground">{{ getStarCount(star) }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Search -->
          <input
            type="text"
            [ngModel]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search reviews..."
            class="mt-5 w-full max-w-md px-4 py-2 bg-input-background border border-border rounded-md text-sm"
          />
        }
      </div>

      @if (loading) {
        <div class="flex items-center justify-center py-16">
          <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        </div>
      } @else if (filtered.length > 0) {
        <div class="grid gap-4 sm:grid-cols-2">
          @for (r of paginated; track r.name + r.submittedAt) {
            <div class="bg-card rounded-lg border border-border p-5 flex flex-col gap-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span class="text-primary text-sm font-medium">{{ getInitials(r.name) }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-foreground">{{ r.name }}</p>
                    @if (r.submittedAt) {
                      <p class="text-xs text-muted-foreground">{{ formatDate(r.submittedAt) }}</p>
                    }
                  </div>
                </div>
                <!-- Stars -->
                <div class="flex items-center gap-0.5 shrink-0">
                  @for (star of [1,2,3,4,5]; track star) {
                    <fa-icon
                      [icon]="['fas', 'star']"
                      class="w-3.5 h-3.5"
                      [class.text-amber-400]="star <= r.rating"
                      [class.text-muted-foreground]="star > r.rating"
                      [class.opacity-30]="star > r.rating"
                    />
                  }
                  <span class="ml-1.5 text-xs font-medium text-foreground">{{ r.rating }}/5</span>
                </div>
              </div>
              @if (r.text) {
                <p class="text-sm text-foreground leading-relaxed border-t border-border pt-3">"{{ r.text }}"</p>
              }
            </div>
          }
        </div>

        <div class="mt-6">
          <mc-pagination
            [totalItems]="filtered.length"
            [pageSize]="pageSize"
            [currentPage]="currentPage"
            (pageChange)="onPageChange($event)"
          />
        </div>
      } @else if (!loading) {
        <div class="bg-card rounded-lg border border-border p-10 text-center">
          <div class="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-5">
            <fa-icon [icon]="['fas', 'star']" class="text-xl text-muted-foreground" />
          </div>
          <h3 class="text-base font-semibold text-foreground">No reviews yet</h3>
          <p class="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            Reviews from your mentees will appear here after their subscriptions end.
          </p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorMyReviewsPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly authApi = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  reviews: MentorProfileReview[] = [];
  loading = true;
  searchQuery = '';
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;

  ngOnInit(): void {
    this.store
      .select(selectAuthUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((userId) => {
        if (!userId) {
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }
        this.authApi.getMentorReviews(userId).pipe(takeUntil(this.destroy$)).subscribe({
          next: (list) => {
            this.reviews = list;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get avgRating(): string {
    if (!this.reviews.length) return '0.0';
    return (this.reviews.reduce((a, r) => a + r.rating, 0) / this.reviews.length).toFixed(1);
  }

  getStarCount(star: number): number {
    return this.reviews.filter((r) => r.rating === star).length;
  }

  getStarPercent(star: number): number {
    if (!this.reviews.length) return 0;
    return (this.getStarCount(star) / this.reviews.length) * 100;
  }

  get filtered(): MentorProfileReview[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.reviews;
    return this.reviews.filter(
      (r) => r.name.toLowerCase().includes(q) || r.text.toLowerCase().includes(q),
    );
  }

  get paginated(): MentorProfileReview[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
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

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  }
}
