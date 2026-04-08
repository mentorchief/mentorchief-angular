import { ReportsFacade } from '../../../core/facades/reports.facade';
import { BehaviorSubject } from 'rxjs';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MentorCardComponent } from '../../../shared/components/mentor-card.component';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import type { Mentor } from '../../../core/models/mentor.model';
import { selectApprovedMentorProfiles } from '../../../store/data-flow.selectors';

const MENTORS_PAGE_SIZE = 9;

@Component({
  selector: 'mc-browse-mentors-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MentorCardComponent, PaginationComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-3xl lg:text-4xl text-foreground">Find Your Perfect Mentor</h1>
        <p class="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Browse our curated network of verified mentors. Filter by expertise, industry, and price.
        </p>
      </div>

      <!-- Filters -->
      <div class="bg-card rounded-lg border border-border p-5 sm:p-6 mb-8">
        <h2 class="text-sm font-medium text-foreground mb-4">Refine your search</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <!-- Search -->
          <div class="lg:col-span-1">
            <label for="browse-search" class="block text-sm font-medium text-muted-foreground mb-1.5">Search</label>
            <input
              id="browse-search"
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="filterMentors()"
              placeholder="Name, expertise, company..."
              class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors placeholder:text-muted-foreground/70"
            />
          </div>

          <!-- Expertise / Category -->
          <div>
            <label for="browse-category" class="block text-sm font-medium text-muted-foreground mb-1.5">Expertise</label>
            <select
              id="browse-category"
              [(ngModel)]="selectedCategory"
              (ngModelChange)="filterMentors()"
              class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            >
              <option value="All">All expertise</option>
              @for (category of categories; track category) {
                <option [value]="category">{{ category }}</option>
              }
            </select>
          </div>

          <!-- Price Range -->
          <div>
            <label for="browse-price" class="block text-sm font-medium text-muted-foreground mb-1.5">Price per month</label>
            <select
              id="browse-price"
              [(ngModel)]="priceRange"
              (ngModelChange)="filterMentors()"
              class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            >
              <option value="all">Any price</option>
              <option value="0-100">Under $100</option>
              <option value="100-150">$100 – $150</option>
              <option value="150-200">$150 – $200</option>
              <option value="200+">Over $200</option>
            </select>
          </div>

          <!-- Sort -->
          <div>
            <label for="browse-sort" class="block text-sm font-medium text-muted-foreground mb-1.5">Sort by</label>
            <select
              id="browse-sort"
              [(ngModel)]="sortBy"
              (ngModelChange)="filterMentors()"
              class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            >
              <option value="recommended">Recommended</option>
              <option value="rating-desc">Rating: High to low</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
              <option value="experience-desc">Experience: High to low</option>
            </select>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-muted-foreground">
            <span class="font-medium text-foreground">{{ filteredMentors.length }}</span> mentor{{ filteredMentors.length === 1 ? '' : 's' }} found
          </p>
          <button
            type="button"
            (click)="resetFilters()"
            class="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
          >
            Clear all filters
          </button>
        </div>
      </div>

      <!-- Mentor Grid -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (mentor of paginatedMentors; track mentor.id) {
          <mc-mentor-card
            [mentor]="mentor"
            [reviewCount]="(reviewCountByMentorId$ | async)?.[mentor.id] ?? 0"
          />
        }
      </div>

      @if (filteredMentors.length > mentorsPageSize) {
        <div class="mt-8">
          <mc-pagination
            [totalItems]="filteredMentors.length"
            [pageSize]="mentorsPageSize"
            [currentPage]="mentorsPage"
            (pageChange)="onMentorsPageChange($event)"
          />
        </div>
      }

      @if (filteredMentors.length === 0) {
        <div class="text-center py-16">
          <p class="text-muted-foreground text-lg">No mentors match your filters.</p>
          <button
            type="button"
            (click)="resetFilters()"
            class="mt-4 px-4 py-2 text-primary hover:bg-secondary rounded-md transition-colors"
          >
            Clear all filters
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowseMentorsPageComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly reportsSvc = inject(ReportsFacade);
  private readonly store = inject(Store);
  readonly reviewCountByMentorId$ = new BehaviorSubject<Record<string,number>>(this.reportsSvc.getReviewCountByMentorId());
  allMentors: Mentor[] = [];
  categories: string[] = ['All'];
  readonly mentorsPageSize = MENTORS_PAGE_SIZE;
  mentorsPage = 1;

  get paginatedMentors(): Mentor[] {
    const list = this.filteredMentors;
    const start = (this.mentorsPage - 1) * this.mentorsPageSize;
    return list.slice(start, start + this.mentorsPageSize);
  }

  searchQuery = '';
  selectedCategory = 'All';
  priceRange = 'all';
  sortBy: 'recommended' | 'rating-desc' | 'price-asc' | 'price-desc' | 'experience-desc' = 'recommended';

  filteredMentors: Mentor[] = [];

  constructor() {
    this.store.select(selectApprovedMentorProfiles).subscribe((mentors) => {
      this.allMentors = mentors;
      this.filteredMentors = [...mentors];
      this.categories = [
        'All',
        ...Array.from(new Set(mentors.flatMap((m) => m.expertise).filter(Boolean))).sort(),
      ];
      this.filterMentors();
    });
  }

  filterMentors(): void {
    let result = [...this.allMentors];

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.title.toLowerCase().includes(query) ||
          m.company.toLowerCase().includes(query) ||
          m.expertise.some((e) => e.toLowerCase().includes(query))
      );
    }

    if (this.selectedCategory !== 'All') {
      result = result.filter((m) =>
        m.expertise.some((e) => e.toLowerCase().includes(this.selectedCategory.toLowerCase()))
      );
    }

    if (this.priceRange !== 'all') {
      switch (this.priceRange) {
        case '0-100':
          result = result.filter((m) => m.price < 100);
          break;
        case '100-150':
          result = result.filter((m) => m.price >= 100 && m.price <= 150);
          break;
        case '150-200':
          result = result.filter((m) => m.price > 150 && m.price <= 200);
          break;
        case '200+':
          result = result.filter((m) => m.price > 200);
          break;
      }
    }

    switch (this.sortBy) {
      case 'rating-desc':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'experience-desc':
        result.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
        break;
      default:
        break;
    }

    this.filteredMentors = result;
    this.mentorsPage = 1;
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'All';
    this.priceRange = 'all';
    this.sortBy = 'recommended';
    this.filteredMentors = [...this.allMentors];
    this.mentorsPage = 1;
    this.cdr.markForCheck();
  }

  onMentorsPageChange(page: number): void {
    this.mentorsPage = page;
    this.cdr.markForCheck();
  }
}
