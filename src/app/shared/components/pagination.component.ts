import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mc-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalItems > pageSize) {
      <div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
        <p class="text-muted-foreground text-sm">
          Showing {{ startIndex }}–{{ endIndex }} of {{ totalItems }}
        </p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="goToPage(currentPage - 1)"
            [disabled]="currentPage <= 1"
            class="px-3 py-1.5 border border-border rounded-md text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span class="text-sm text-muted-foreground px-2">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            type="button"
            (click)="goToPage(currentPage + 1)"
            [disabled]="currentPage >= totalPages"
            class="px-3 py-1.5 border border-border rounded-md text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    }
  `,
})
export class PaginationComponent {
  @Input({ required: true }) totalItems!: number;
  @Input({ required: true }) pageSize!: number;
  @Input({ required: true }) currentPage!: number;

  @Output() pageChange = new EventEmitter<number>();

  get startIndex(): number {
    const total = this.totalItems;
    const size = this.pageSize;
    const page = this.currentPage;
    if (total === 0) return 0;
    return (page - 1) * size + 1;
  }

  get endIndex(): number {
    const total = this.totalItems;
    const size = this.pageSize;
    const page = this.currentPage;
    return Math.min(page * size, total);
  }

  get totalPages(): number {
    const total = this.totalItems;
    const size = this.pageSize;
    return size > 0 ? Math.ceil(total / size) : 1;
  }

  goToPage(page: number): void {
    const max = this.totalPages;
    if (page >= 1 && page <= max) {
      this.pageChange.emit(page);
    }
  }
}
