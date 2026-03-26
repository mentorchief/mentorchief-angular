import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, map, take } from 'rxjs';
import type { Mentor } from '../../../core/models/mentor.model';
import type { AppState } from '../../../store/app.state';
import { selectAuthUser } from '../../auth/store/auth.selectors';
import { selectMentorProfileReviews } from '../../dashboard/store/dashboard.selectors';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UserRole } from '../../../core/models/user.model';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { selectActiveMentorsAsMentor } from '../../../store/users/users.selectors';
import { AuthApiService } from '../../../core/services/auth-api.service';


@Component({
  selector: 'mc-mentor-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FontAwesomeModule],
  template: `
    @if (mentor$ | async; as mentor) {
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <!-- Back Link -->
        <a routerLink="/browse" class="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 no-underline">
          ← Back to mentors
        </a>

        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Profile Header -->
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <div class="flex items-start gap-6">
                <img
                  [src]="mentor.image"
                  [alt]="mentor.name"
                  class="w-24 h-24 rounded-lg object-cover"
                />
                <div class="flex-1">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-3">
                        <h1 class="text-2xl text-gray-900 font-bold">{{ mentor.name }}</h1>
                        <span
                          [class]="mentor.acceptingMentees ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                          class="px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1"
                        >
                          <span [class]="mentor.acceptingMentees ? 'bg-green-500' : 'bg-red-500'" class="w-1.5 h-1.5 rounded-full"></span>
                          {{ mentor.acceptingMentees ? 'Accepting Mentees' : 'Not Accepting' }}
                        </span>
                      </div>
                      <p class="text-gray-500 mt-1">{{ mentor.title }} at {{ mentor.company }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-4 mt-4 flex-wrap">
                    <div class="flex items-center gap-1.5">
                      @if ((reviewCount$ | async)! > 0) {
                        <fa-icon [icon]="['fas', 'star']" class="text-amber-400 w-4 h-4" />
                        <span class="text-gray-900 font-medium">{{ mentor.rating }}</span>
                        <span class="text-gray-500 text-sm">({{ (reviewCount$ | async) ?? 0 }} reviews)</span>
                      } @else {
                        <span class="text-gray-500 text-sm">No reviews yet</span>
                      }
                    </div>
                    <div class="text-gray-500 text-sm flex items-center gap-1.5">
                      <fa-icon [icon]="['fas', 'users']" class="w-3.5 h-3.5" />
                      {{ mentor.sessions }} mentorships
                    </div>
                    <div class="text-gray-500 text-sm flex items-center gap-1.5">
                      <fa-icon [icon]="['fas', 'briefcase']" class="w-3.5 h-3.5" />
                      {{ mentor.yearsOfExperience }} years exp
                    </div>
                    <div class="text-gray-500 text-sm flex items-center gap-1.5">
                      <fa-icon [icon]="['fas', 'clock']" class="w-3.5 h-3.5" />
                      Responds within 2 days
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- About -->
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h2 class="text-lg text-gray-900 font-semibold mb-4">About</h2>
              <p class="text-gray-600 leading-relaxed">{{ mentor.bio }}</p>
            </div>

            <!-- Expertise -->
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h2 class="text-lg text-gray-900 font-semibold mb-4">Areas of Expertise</h2>
              <div class="flex flex-wrap gap-2">
                @for (skill of mentor.expertise; track skill) {
                  <span class="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md text-sm">
                    {{ skill }}
                  </span>
                }
              </div>
            </div>

            <!-- Reviews -->
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h2 class="text-lg text-gray-900 font-semibold">Reviews</h2>
                  <p class="text-sm text-gray-500 mt-0.5">{{ (reviewCount$ | async) ?? 0 }} review{{ ((reviewCount$ | async) ?? 0) === 1 ? '' : 's' }} from mentees</p>
                </div>
                @if ((reviewCount$ | async)! > 0) {
                  <div class="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-md">
                    <fa-icon [icon]="['fas', 'star']" class="text-amber-400 w-4 h-4" />
                    <span class="text-amber-700 font-semibold text-sm">{{ mentor.rating }}</span>
                  </div>
                }
              </div>
              <div class="space-y-4">
                @for (review of (displayedReviews$ | async) ?? []; track review.name) {
                  <div class="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium">
                          {{ getInitials(review.name) }}
                        </div>
                        <div>
                          <span class="text-gray-900 text-sm font-medium">{{ review.name }}</span>
                          @if (review.submittedAt) {
                            <span class="text-gray-400 text-xs ml-2">{{ formatDate(review.submittedAt) }}</span>
                          }
                        </div>
                      </div>
                      <div class="flex items-center gap-1">
                        @for (star of getStars(review.rating); track $index) {
                          <fa-icon [icon]="['fas', 'star']" class="text-amber-400 text-sm w-3.5 h-3.5" />
                        }
                      </div>
                    </div>
                    <p class="text-gray-600 text-sm">{{ review.text }}</p>
                  </div>
                }
                @if (((reviewCount$ | async) ?? 0) === 0) {
                  <p class="text-gray-400 text-sm text-center py-4">No reviews yet. Be the first mentee to leave a review!</p>
                }
              </div>
              @if (((reviewCount$ | async) ?? 0) > sampleReviewsCount) {
                <div class="mt-4 pt-4 border-t border-gray-200">
                  <a
                    [routerLink]="['/mentor', mentor.id, 'reviews']"
                    class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium no-underline"
                  >
                    View all {{ reviewCount$ | async }} reviews
                    <fa-icon [icon]="['fas', 'chevron-right']" class="w-3 h-3" />
                  </a>
                </div>
              }
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Pricing Card -->
            <div class="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              @if (mentor.mentorPlans.length) {
                <div class="mb-6">
                  <div class="text-lg text-gray-900 font-semibold mb-3 text-center">Plans</div>
                  <div class="space-y-3">
                    @for (plan of mentor.mentorPlans; track plan.id) {
                      <div class="rounded-lg border border-gray-200 p-4 hover:border-indigo-300 transition-colors">
                        <div class="flex items-center justify-between">
                          <div>
                            <div class="text-sm font-medium text-gray-900">{{ formatPlanDuration(plan.duration) }}</div>
                            <div class="text-xs text-gray-500 mt-0.5">{{ getPlanDescription(plan.duration) }}</div>
                          </div>
                          <div class="text-right">
                            <div class="text-lg text-indigo-600 font-bold">\${{ plan.price }}</div>
                            <div class="text-xs text-gray-400">{{ getPlanPeriodLabel(plan.duration) }}</div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="text-center mb-6">
                  <div class="text-3xl text-indigo-600 font-bold">\${{ mentor.price }}</div>
                  <div class="text-gray-500 text-sm">per month</div>
                </div>
              }

              <div class="space-y-3 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600">
                  <fa-icon [icon]="['fas', 'check']" class="text-green-500 w-4 h-4" />
                  Unlimited messaging
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-600">
                  <fa-icon [icon]="['fas', 'check']" class="text-green-500 w-4 h-4" />
                  Monthly report
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-600">
                  <fa-icon [icon]="['fas', 'check']" class="text-green-500 w-4 h-4" />
                  Responds in {{ mentor.responseTime }}
                </div>
              </div>

              @if (user$ | async; as user) {
                @if (user.role === UserRole.Mentee) {
                  @if (hasActiveMentorship) {
                    <div class="w-full py-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-center font-medium flex items-center justify-center gap-2">
                      <fa-icon [icon]="['fas', 'circle-check']" class="w-4 h-4" />
                      Already your mentor
                    </div>
                    <a
                      routerLink="/dashboard/mentee/messages"
                      class="mt-3 w-full block text-center py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium no-underline"
                    >
                      Message Mentor
                    </a>
                  } @else if (hasPendingRequest) {
                    <div class="space-y-3">
                      <div class="w-full py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-center font-medium flex items-center justify-center gap-2">
                        <fa-icon [icon]="['fas', 'clock']" class="w-4 h-4" />
                        Request Pending
                      </div>
                      <p class="text-xs text-amber-600 text-center">
                        Your request is awaiting the mentor&apos;s response. You can cancel until they respond.
                      </p>
                      <button
                        (click)="onCancelRequest()"
                        class="w-full py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Cancel Request
                      </button>
                    </div>
                  } @else if (!mentor.acceptingMentees) {
                    <button
                      disabled
                      class="w-full py-3 bg-gray-100 text-gray-400 rounded-md font-medium cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <fa-icon [icon]="['fas', 'ban']" class="w-4 h-4" />
                      Not Accepting Mentees
                    </button>
                    <p class="text-xs text-gray-500 text-center mt-2">
                      This mentor is not accepting new mentees at the moment. Check back later.
                    </p>
                  } @else if (isAtCapacity) {
                    <button
                      disabled
                      class="w-full py-3 bg-gray-100 text-gray-400 rounded-md font-medium cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <fa-icon [icon]="['fas', 'user-slash']" class="w-4 h-4" />
                      At Capacity
                    </button>
                    <p class="text-xs text-gray-500 text-center mt-2">
                      This mentor has reached their maximum number of mentees. Check back later.
                    </p>
                  } @else {
                    <button
                      [routerLink]="['/mentor', mentor.id, 'request']"
                      class="w-full py-3 bg-indigo-600 text-white rounded-md hover:opacity-90 transition-opacity font-medium"
                    >
                      Request Mentorship
                    </button>
                  }
                } @else {
                  @if (user.role === UserRole.Mentor) {
                    <div class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      You&apos;re signed in as a mentor. Mentors can&apos;t subscribe to other mentors. Switch to a mentee account if you want to request mentorship.
                    </div>
                  } @else {
                    <div class="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                      You&apos;re signed in as an admin. Use the admin dashboard to manage mentorships instead of requesting a subscription.
                    </div>
                  }
                }
              } @else {
                <a
                  [routerLink]="['/login']"
                  [queryParams]="{ returnUrl: '/mentor/' + mentor.id + '/request' }"
                  class="w-full block text-center py-3 bg-indigo-600 text-white rounded-md hover:opacity-90 transition-opacity font-medium no-underline"
                >
                  Sign in to request mentorship
                </a>
                <p class="text-xs text-muted-foreground text-center mt-2">
                  You&apos;ll need a mentee account to request a subscription with this mentor.
                </p>
              }

              <!-- How it works hint -->
              <div class="mt-5 pt-4 border-t border-gray-200">
                <p class="text-xs font-medium text-gray-700 mb-2">How it works</p>
                <div class="space-y-2">
                  <div class="flex items-start gap-2 text-xs text-gray-500">
                    <span class="shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Send a request — the mentor reviews and accepts</span>
                  </div>
                  <div class="flex items-start gap-2 text-xs text-gray-500">
                    <span class="shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Your payment is held safely in escrow</span>
                  </div>
                  <div class="flex items-start gap-2 text-xs text-gray-500">
                    <span class="shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Work with your mentor throughout the subscription</span>
                  </div>
                  <div class="flex items-start gap-2 text-xs text-gray-500">
                    <span class="shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">4</span>
                    <span>Funds are released to the mentor when the period ends</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Request Mentorship Modal -->
      @if (showRequestModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div class="absolute inset-0 bg-foreground/50 backdrop-blur-sm" (click)="showRequestModal = false"></div>
          <div class="relative bg-card rounded-lg shadow-xl border border-border max-w-md w-full p-6" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-medium text-foreground">
              Request Mentorship from {{ mentor.name }}
            </h2>
            <p class="text-muted-foreground text-sm mt-2">
              Choose a plan and confirm your request. You'll be charged when the mentor accepts.
            </p>
            <div class="mt-4 space-y-3">
              <label class="block text-sm font-medium text-foreground">Plan</label>
              <select [(ngModel)]="selectedPlan" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md">
                @for (plan of mentor.mentorPlans; track plan.id) {
                  <option [value]="plan.id">{{ formatPlanDuration(plan.duration) }} - \${{ plan.price }}/{{ plan.duration === 'monthly' ? 'month' : plan.duration === 'quarterly' ? 'quarter' : '6 months' }}</option>
                }
                @if (!mentor.mentorPlans.length) {
                  <option value="monthly">Monthly - \${{ mentor.price }}/month</option>
                }
              </select>
              <label class="block text-sm font-medium text-foreground mt-3">Message (optional)</label>
              <textarea
                [(ngModel)]="requestMessage"
                rows="3"
                placeholder="Introduce yourself and your goals..."
                class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md"
              ></textarea>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button
                (click)="showRequestModal = false"
                class="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                (click)="onSubmitRequest()"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      }
    } @else {
      <div class="max-w-5xl mx-auto px-4 py-12 text-center">
        <h1 class="text-2xl text-gray-900 font-bold mb-4">Mentor not found</h1>
        <a routerLink="/browse" class="text-indigo-600 hover:underline no-underline">
          Browse all mentors
        </a>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorProfilePageComponent implements OnInit {
  readonly UserRole = UserRole;
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store<AppState>);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly authApi = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  showRequestModal = false;
  selectedPlan = 'monthly';
  requestMessage = '';
  hasPendingRequest = false;
  hasActiveMentorship = false;
  isAtCapacity = false;
  submittingRequest = false;
  private currentMentor: Mentor | null = null;
  private currentMentorshipId: string | null = null;

  readonly sampleReviewsCount = 3;

  readonly mentor$ = combineLatest([
    this.store.select(selectActiveMentorsAsMentor),
    this.route.paramMap,
  ]).pipe(
    map(([mentors, params]) => {
      const id = params.get('id');
      return id ? (mentors.find((m) => m.id === id) ?? null) : null;
    }),
  );

  readonly user$ = this.store.select(selectAuthUser);
  readonly profileReviews$ = combineLatest([
    this.store.select(selectMentorProfileReviews),
    this.route.paramMap,
  ]).pipe(
    map(([reviews, params]) => {
      const id = params.get('id');
      return id ? reviews.filter((r) => r.mentorId === id) : [];
    }),
  );
  readonly reviewCount$ = this.profileReviews$.pipe(map((reviews) => reviews.length));
  readonly displayedReviews$ = this.profileReviews$.pipe(map((reviews) => reviews.slice(0, this.sampleReviewsCount)));

  private static readonly PLAN_DURATION_LABELS: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    '6months': '6 Months',
  };

  constructor() {
    this.showRequestModal = this.route.snapshot.routeConfig?.path === 'mentor/:id/request';
    this.mentor$.subscribe((m) => {
      this.currentMentor = m;
      if (m?.mentorPlans?.length) {
        this.selectedPlan = m.mentorPlans[0].id;
      }
    });
  }

  ngOnInit(): void {
    const mentorId = this.route.snapshot.paramMap.get('id');
    if (!mentorId) return;

    // Check capacity (default 5, from platform config)
    this.mentor$.pipe(take(1)).subscribe((mentor) => {
      if (mentor) {
        const defaultCap = 5;
        this.isAtCapacity = mentor.sessions >= defaultCap;
        this.cdr.markForCheck();
      }
    });

    this.store.select(selectAuthUser).pipe(take(1)).subscribe((user) => {
      if (!user || user.role !== UserRole.Mentee) return;
      this.authApi.getMentorshipForMenteeAndMentor(user.id, mentorId).subscribe({
        next: (mentorship) => {
          if (mentorship) {
            if (mentorship.status === 'active') {
              this.hasActiveMentorship = true;
            } else if (mentorship.status === 'pending') {
              this.hasPendingRequest = true;
            }
            this.currentMentorshipId = mentorship.id;
          }
          this.cdr.markForCheck();
        },
        error: () => { /* no active mentorship */ },
      });
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  }

  getStars(rating: number): number[] {
    return Array.from({ length: rating });
  }

  formatPlanDuration(duration: string): string {
    return MentorProfilePageComponent.PLAN_DURATION_LABELS[duration] ?? duration;
  }

  getPlanDescription(duration: string): string {
    const descriptions: Record<string, string> = {
      monthly: 'Billed every month',
      quarterly: 'Billed every 3 months',
      '6months': 'Billed every 6 months',
    };
    return descriptions[duration] ?? '';
  }

  getPlanPeriodLabel(duration: string): string {
    const labels: Record<string, string> = {
      monthly: '/month',
      quarterly: '/quarter',
      '6months': '/6 months',
    };
    return labels[duration] ?? '';
  }

  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  }

  onSubmitRequest(): void {
    this.showRequestModal = false;
    const mentor = this.currentMentor;
    if (!mentor?.id || this.submittingRequest) return;
    this.submittingRequest = true;

    this.store.select(selectAuthUser).pipe(take(1)).subscribe((user) => {
      if (!user) {
        this.submittingRequest = false;
        this.toast.error('You must be logged in to request mentorship.');
        return;
      }
      const selectedPlanObj = mentor.mentorPlans?.find((p) => p.id === this.selectedPlan);
      const planName = selectedPlanObj ? this.formatPlanDuration(selectedPlanObj.duration) : 'Monthly';
      const amount = selectedPlanObj ? parseFloat(String(selectedPlanObj.price)) || 0 : (mentor.price ?? 0);

      this.authApi.requestMentorship(mentor.id, user.id, '', this.requestMessage, planName, amount).subscribe({
        next: (mentorship) => {
          this.hasPendingRequest = true;
          this.currentMentorshipId = mentorship.id;
          this.submittingRequest = false;
          this.requestMessage = '';
          // Notify mentor of new request
          this.authApi.createNotification({
            userId: mentor.id,
            type: 'mentorship_request',
            title: 'New mentorship request',
            body: `${user.name} has requested ${planName} mentorship ($${amount}).`,
            metadata: { mentorshipId: mentorship.id, menteeId: user.id, planName, amount },
          }).subscribe();
          this.toast.success(`Mentorship request sent to ${mentor.name}! You'll be notified once they respond.`);
          this.cdr.markForCheck();
        },
        error: (err: Error) => {
          this.submittingRequest = false;
          this.toast.error(err.message ?? 'Failed to send mentorship request. Please try again.');
          this.cdr.markForCheck();
        },
      });
    });
  }

  async onCancelRequest(): Promise<void> {
    if (!this.currentMentor?.id) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Cancel mentorship request',
      message: `Are you sure you want to cancel your request to ${this.currentMentor.name}? You can send a new request later if you change your mind.`,
      confirmLabel: 'Yes, cancel request',
      cancelLabel: 'Keep request',
      variant: 'danger',
    });
    if (!confirmed) return;
    if (this.currentMentorshipId) {
      this.authApi.cancelMentorship(this.currentMentorshipId).subscribe({
        next: () => {
          this.hasPendingRequest = false;
          this.currentMentorshipId = null;
          this.toast.success(`Mentorship request to ${this.currentMentor!.name} has been cancelled.`);
          this.cdr.markForCheck();
        },
        error: () => { this.toast.error('Failed to cancel the request. Please try again.'); },
      });
    } else {
      this.hasPendingRequest = false;
      this.toast.success(`Mentorship request to ${this.currentMentor.name} has been cancelled.`);
      this.cdr.markForCheck();
    }
  }
}
