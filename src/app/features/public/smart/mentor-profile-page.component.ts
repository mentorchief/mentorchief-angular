import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, map, take } from 'rxjs';
import type { MentorProfile } from '../../../core/models/mentor-profile.model';
import type { AppState } from '../../../store/app.state';
import { selectAuthUser } from '../../auth/store/auth.selectors';
import { selectMentorProfileReviews } from '../../dashboard/store/dashboard.selectors';
import { selectApprovedMentorProfiles } from '../../../store/users/users.selectors';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UserRole } from '../../../core/models/user.model';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'mc-mentor-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FontAwesomeModule],
  template: `
    @if (mentor) {
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
                @if (mentor.photoUrl) {
                  <img
                    [src]="mentor.photoUrl"
                    [alt]="mentor.name"
                    class="w-24 h-24 rounded-lg object-cover"
                  />
                } @else {
                  <div class="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-2xl font-semibold">
                    {{ getInitials(mentor.name) }}
                  </div>
                }
                <div class="flex-1">
                  <div class="flex items-start justify-between">
                    <div>
                      <h1 class="text-2xl text-gray-900 font-bold">{{ mentor.name }}</h1>
                      <p class="text-gray-500 mt-1">{{ mentor.title }} at {{ mentor.company }}</p>
                    </div>
                    <span
                      [class]="mentor.availability === 'Available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                      class="px-3 py-1 rounded-md text-sm"
                    >
                      {{ mentor.availability }}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 mt-4">
                    <div class="flex items-center gap-1.5">
                      <fa-icon [icon]="['fas', 'star']" class="text-amber-400 w-4 h-4" />
                      <span class="text-gray-900 font-medium">{{ mentor.rating }}</span>
                      <span class="text-gray-500 text-sm">({{ (reviewCount$ | async) ?? 0 }} reviews)</span>
                    </div>
                    @if (mentor.sessions) {
                      <div class="text-gray-500 text-sm">{{ mentor.sessions }} subscriptions</div>
                    }
                    @if (mentor.yearsOfExperience) {
                      <div class="text-gray-500 text-sm">{{ mentor.yearsOfExperience }} years exp</div>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- About -->
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h2 class="text-lg text-gray-900 font-semibold mb-4">About</h2>
              <p class="text-gray-600 leading-relaxed">{{ mentor.bio || 'No bio provided yet.' }}</p>
            </div>

            <!-- Expertise -->
            @if (mentor.expertise.length > 0) {
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
            }

            <!-- Reviews -->
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h2 class="text-lg text-gray-900 font-semibold mb-2">Reviews</h2>
              @if ((profileReviews$ | async)?.length) {
                <div class="space-y-4">
                  @for (review of (profileReviews$ | async) ?? []; track review.name) {
                    <div class="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium">
                            {{ getInitials(review.name) }}
                          </div>
                          <span class="text-gray-900 text-sm font-medium">{{ review.name }}</span>
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
                </div>
                @if ((reviewCount$ | async) ?? 0 > sampleReviewsCount) {
                  <p class="mt-4 pt-4 border-t border-gray-200">
                    <a
                      [routerLink]="['/mentor', mentor.id, 'reviews']"
                      class="text-indigo-600 hover:text-indigo-800 text-sm font-medium no-underline"
                    >
                      See more ({{ reviewCount$ | async }} reviews) →
                    </a>
                  </p>
                }
              } @else {
                <p class="text-gray-500 text-sm mt-2">No reviews yet.</p>
              }
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Pricing Card -->
            <div class="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <div class="text-center mb-6">
                <div class="text-3xl text-indigo-600 font-bold">\${{ mentor.price }}</div>
                <div class="text-gray-500 text-sm">per month</div>
              </div>

              <div class="space-y-3 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600">
                  <fa-icon [icon]="['fas', 'check']" class="text-green-500 w-4 h-4" />
                  Unlimited messaging
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-600">
                  <fa-icon [icon]="['fas', 'check']" class="text-green-500 w-4 h-4" />
                  Monthly report
                </div>
                @if (mentor.responseTime) {
                  <div class="flex items-center gap-3 text-sm text-gray-600">
                    <fa-icon [icon]="['fas', 'check']" class="text-green-500 w-4 h-4" />
                    Responds in {{ mentor.responseTime }}
                  </div>
                }
              </div>

              @if (user$ | async; as user) {
                @if (user.role === UserRole.Mentee) {
                  @if (hasPendingRequest) {
                    <div class="space-y-3">
                      <p class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-center">
                        Request pending. You can cancel until the mentor responds.
                      </p>
                      <button
                        (click)="onCancelRequest()"
                        class="w-full py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel Request
                      </button>
                    </div>
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
                      You're signed in as a mentor. Mentors can't subscribe to other mentors. Switch to a mentee account if you want to request mentorship.
                    </div>
                  } @else {
                    <div class="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                      You're signed in as an admin. Use the admin dashboard to manage mentorships instead of requesting a subscription.
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
                  You'll need a mentee account to request a subscription with this mentor.
                </p>
              }

              <p class="text-xs text-gray-500 text-center mt-4">
                Your payment is protected by escrow until the mentorship period completes.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Request Mentorship Modal -->
      @if (showRequestModal && mentor) {
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
                <option value="monthly">Monthly - \${{ mentor.price }}/month</option>
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
export class MentorProfilePageComponent {
  readonly UserRole = UserRole;
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store<AppState>);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly cdr = inject(ChangeDetectorRef);

  mentor: MentorProfile | undefined;
  showRequestModal = false;
  selectedPlan = 'monthly';
  requestMessage = '';
  hasPendingRequest = false;

  private static readonly PENDING_STORAGE_KEY = 'mentorchief_pending_mentorship_requests';

  readonly sampleReviewsCount = 3;

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

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    this.store.select(selectApprovedMentorProfiles).pipe(take(1)).subscribe((mentors) => {
      this.mentor = id ? mentors.find((m) => m.id === id) : undefined;
      this.cdr.markForCheck();
    });
    this.hasPendingRequest = this.getPendingRequestIds().includes(id ?? '');
    this.showRequestModal = this.route.snapshot.routeConfig?.path === 'mentor/:id/request';
  }

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  }

  getStars(rating: number): number[] {
    return Array.from({ length: rating });
  }

  private getPendingRequestIds(): string[] {
    try {
      const raw = sessionStorage.getItem(MentorProfilePageComponent.PENDING_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private setPendingRequestIds(ids: string[]): void {
    sessionStorage.setItem(MentorProfilePageComponent.PENDING_STORAGE_KEY, JSON.stringify(ids));
  }

  onSubmitRequest(): void {
    this.showRequestModal = false;
    if (this.mentor?.id) {
      const ids = this.getPendingRequestIds();
      if (!ids.includes(this.mentor.id)) {
        this.setPendingRequestIds([...ids, this.mentor.id]);
      }
      this.hasPendingRequest = true;
    }
    this.toast.success(`Mentorship request sent to ${this.mentor?.name}! You'll be notified once they respond.`);
    this.requestMessage = '';
  }

  async onCancelRequest(): Promise<void> {
    if (!this.mentor?.id) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Cancel mentorship request',
      message: `Are you sure you want to cancel your request to ${this.mentor.name}? You can send a new request later if you change your mind.`,
      confirmLabel: 'Yes, cancel request',
      cancelLabel: 'Keep request',
      variant: 'danger',
    });
    if (!confirmed) return;
    const ids = this.getPendingRequestIds().filter((id) => id !== this.mentor!.id);
    this.setPendingRequestIds(ids);
    this.hasPendingRequest = false;
    this.toast.success(`Mentorship request to ${this.mentor.name} has been cancelled.`);
  }
}
