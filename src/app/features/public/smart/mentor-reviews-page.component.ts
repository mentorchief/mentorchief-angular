import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectMentorProfileReviews } from '../../dashboard/store/dashboard.selectors';
import { selectActiveMentorsAsMentor } from '../../../store/users/users.selectors';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'mc-mentor-reviews-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  template: `
    @if (mentor$ | async; as mentor) {
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <a
          [routerLink]="['/mentor', mentor.id]"
          class="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 no-underline"
        >
          ← Back to {{ mentor.name }}'s profile
        </a>

        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h1 class="text-2xl text-gray-900 font-bold mb-1">Reviews</h1>
          <p class="text-gray-500 text-sm mb-6">
            {{ (profileReviews$ | async)?.length ?? 0 }} reviews for {{ mentor.name }}
          </p>
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
        </div>
      </div>
    } @else {
      <div class="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 class="text-2xl text-gray-900 font-bold mb-4">Mentor not found</h1>
        <a routerLink="/browse" class="text-indigo-600 hover:underline no-underline">
          Browse all mentors
        </a>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorReviewsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store<AppState>);

  readonly mentor$ = combineLatest([
    this.store.select(selectActiveMentorsAsMentor),
    this.route.paramMap,
  ]).pipe(
    map(([mentors, params]) => {
      const id = params.get('id');
      return id ? (mentors.find((m) => m.id === id) ?? null) : null;
    }),
  );

  readonly profileReviews$ = combineLatest([
    this.store.select(selectMentorProfileReviews),
    this.route.paramMap,
  ]).pipe(
    map(([reviews, params]) => {
      const id = params.get('id');
      return id ? reviews.filter((r) => r.mentorId === id) : [];
    }),
  );

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  }

  getStars(rating: number): number[] {
    return Array.from({ length: rating });
  }
}
