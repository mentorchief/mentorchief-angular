import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { Mentor } from '../../core/models/mentor.model';

@Component({
  selector: 'mc-mentor-card',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <a
      [routerLink]="['/mentor', mentor.id]"
      class="group flex flex-col bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 no-underline"
    >
      <!-- Image -->
      <div class="relative h-52 overflow-hidden shrink-0 bg-muted">
        <img
          [src]="mentor.image"
          [alt]="mentor.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div class="absolute top-3 right-3">
          <span
            [class]="mentor.availability === 'Available'
              ? 'bg-green-100 text-green-700'
              : 'bg-muted text-muted-foreground'"
            class="px-2.5 py-1 rounded-md text-xs"
          >
            {{ mentor.availability === 'Available' ? 'Available' : 'Not Available' }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="flex flex-col flex-1 p-5">
        <h3 class="text-foreground group-hover:text-primary transition-colors leading-snug">
          {{ mentor.name }}
        </h3>
        <p class="text-muted-foreground text-sm mt-0.5">
          {{ mentor.title }} at {{ mentor.company }}
        </p>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1.5 mt-3 flex-1">
          @for (tag of mentor.expertise.slice(0, 3); track tag) {
            <span class="px-2.5 py-0.5 bg-secondary text-secondary-foreground rounded-md text-xs h-fit">
              {{ tag }}
            </span>
          }
        </div>

        <!-- Rating row -->
        <div class="flex items-center gap-3 mt-4">
          <div class="flex items-center gap-1.5">
            @if ((reviewCount ?? mentor.reviews) > 0) {
              <fa-icon [icon]="['fas', 'star']" class="text-amber-400 w-4 h-4" />
              <span class="text-foreground text-sm">{{ mentor.rating }}</span>
              <span class="text-muted-foreground text-xs">({{ reviewCount ?? mentor.reviews }})</span>
            } @else {
              <span class="text-muted-foreground text-xs">No reviews yet</span>
            }
          </div>
          @if (mentor.yearsOfExperience) {
            <div class="flex items-center gap-1 text-muted-foreground text-xs">
              <fa-icon [icon]="['fas', 'briefcase']" class="w-3.5 h-3.5" />
              {{ mentor.yearsOfExperience }}yr exp
            </div>
          }
        </div>

        <!-- Price -->
        <div class="mt-3 pt-3 border-t border-border flex items-baseline gap-1">
          <span class="text-xl text-primary font-semibold">\${{ mentor.price }}</span>
          <span class="text-muted-foreground text-xs">/ month</span>
        </div>
      </div>
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorCardComponent {
  @Input({ required: true }) mentor!: Mentor;
  /** When provided, used as review count (from store); otherwise falls back to mentor.reviews. */
  @Input() reviewCount?: number;
}
