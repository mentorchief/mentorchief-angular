import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast.service';
import { selectMyMenteesPending, selectMyMenteesActive } from '../store/dashboard.selectors';
import { selectAuthUser } from '../../auth/store/auth.selectors';
import { parseMenteeCapacity } from '../../../core/utils/mentor.utils';
import { DEFAULT_MENTEE_CAPACITY } from '../../../core/constants';
import { map } from 'rxjs';
import { acceptMenteeRequest, removeMenteeFromList } from '../store/dashboard.actions';
import type { MenteeListItem } from '../../../core/models/dashboard.model';
import { PaginationComponent } from '../../../shared/components/pagination.component';

const ACTIVE_PAGE_SIZE = 10;

@Component({
  selector: 'mc-my-mentees-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">My Mentees</h1>
        <p class="text-muted-foreground mt-1">Manage your mentorship relationships</p>
      </div>

      <!-- Stats -->
      <div class="grid sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Active Mentees</div>
          <div class="text-2xl text-foreground font-semibold">{{ (activeMentees$ | async)?.length ?? 0 }}</div>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Pending Requests</div>
          <div class="text-2xl text-foreground font-semibold">{{ (pendingMentees$ | async)?.length ?? 0 }}</div>
        </div>
        <div class="bg-card rounded-lg border border-border p-5">
          <div class="text-muted-foreground text-sm mb-1">Capacity</div>
          <div class="text-2xl text-foreground font-semibold">{{ (activeMentees$ | async)?.length ?? 0 }}/{{ (mentorCapacity$ | async) ?? defaultCapacity }}</div>
        </div>
      </div>

      <!-- Pending Requests -->
      @if ((pendingMentees$ | async)?.length) {
        <div class="mb-8">
          <h2 class="text-lg text-foreground mb-4">Pending Requests</h2>
          <div class="grid gap-4">
            @for (mentee of (pendingMentees$ | async) ?? []; track mentee.id) {
              <div class="bg-card rounded-lg border border-amber-200 p-5">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span class="text-primary-foreground font-medium">{{ getInitials(mentee.name) }}</span>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-foreground font-medium">{{ mentee.name }}</h3>
                    <p class="text-muted-foreground text-sm">{{ mentee.email }}</p>
                    <p class="text-muted-foreground text-xs mt-1">Requested: {{ mentee.plan }}</p>
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      (click)="onAcceptMentee(mentee)"
                      class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      (click)="onDeclineMentee(mentee)"
                      class="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-muted"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Active Mentees -->
      <div>
        <h2 class="text-lg text-foreground mb-4">Active Mentees</h2>
        <div class="bg-card rounded-lg border border-border overflow-hidden">
          <div class="p-4 border-b border-border">
            <input
              type="text"
              [ngModel]="activeSearchQuery"
              (ngModelChange)="onActiveSearchChange($event)"
              placeholder="Search by name, email, plan..."
              class="w-full max-w-md px-4 py-2 bg-input-background border border-border rounded-md text-sm"
            />
          </div>
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mentee</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Plan</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Start Date</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (mentee of activeMenteesPaginated; track mentee.id) {
                <tr class="border-b border-border last:border-0">
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        <span class="text-secondary-foreground text-sm font-medium">{{ getInitials(mentee.name) }}</span>
                      </div>
                      <div>
                        <p class="text-foreground text-sm font-medium">{{ mentee.name }}</p>
                        <p class="text-muted-foreground text-xs">{{ mentee.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-4 text-sm text-foreground">{{ mentee.plan }}</td>
                  <td class="px-5 py-4 text-sm text-muted-foreground">{{ mentee.startDate }}</td>
                  <td class="px-5 py-4">
                    <div class="flex flex-wrap items-center gap-2">
                      <a
                        routerLink="/dashboard/mentor/messages"
                        class="px-3 py-1.5 border border-border text-foreground rounded-md text-sm hover:bg-muted no-underline inline-block"
                      >
                        Message
                      </a>
                      @if (isPeriodExceeded(mentee)) {
                        <a
                          [routerLink]="['/dashboard/mentor/report', mentee.id]"
                          class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs hover:opacity-90 no-underline inline-block"
                        >
                          End mentorship & add report
                        </a>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="p-4">
          <mc-pagination
            [totalItems]="activeMenteesFiltered.length"
            [pageSize]="activePageSize"
            [currentPage]="activePage"
            (pageChange)="onActivePageChange($event)"
          />
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyMenteesPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly defaultCapacity = DEFAULT_MENTEE_CAPACITY;
  readonly pendingMentees$ = this.store.select(selectMyMenteesPending);
  readonly activeMentees$ = this.store.select(selectMyMenteesActive);
  readonly mentorCapacity$ = this.store.select(selectAuthUser).pipe(
    map((u) => parseMenteeCapacity(u?.menteeCapacity)),
  );
  activeMenteesList: MenteeListItem[] = [];
  activeSearchQuery = '';
  readonly activePageSize = ACTIVE_PAGE_SIZE;
  activePage = 1;

  ngOnInit(): void {
    this.activeMentees$.pipe(takeUntil(this.destroy$)).subscribe((list) => {
      this.activeMenteesList = list;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get activeMenteesFiltered(): MenteeListItem[] {
    const list = this.activeMenteesList;
    const q = this.activeSearchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter((m) =>
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.plan.toLowerCase().includes(q)
    );
  }

  get activeMenteesPaginated(): MenteeListItem[] {
    const list = this.activeMenteesFiltered;
    const start = (this.activePage - 1) * this.activePageSize;
    return list.slice(start, start + this.activePageSize);
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

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  /** True if the mentorship plan period (e.g. 1 month for Monthly, 3 for Quarterly) has ended. */
  isPeriodExceeded(mentee: MenteeListItem): boolean {
    const start = new Date(mentee.startDate);
    if (Number.isNaN(start.getTime())) return false;
    const months = mentee.plan.toLowerCase().includes('quarter') ? 3 : 1;
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return new Date() >= end;
  }

  onAcceptMentee(mentee: MenteeListItem): void {
    this.store.dispatch(acceptMenteeRequest({ menteeId: mentee.id }));
    this.toast.success(`${mentee.name} has been added to your mentees.`);
  }

  async onDeclineMentee(mentee: MenteeListItem): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Decline request',
      message: `Are you sure you want to decline ${mentee.name}'s mentorship request? They will be notified.`,
      confirmLabel: 'Yes, decline',
      cancelLabel: 'Keep request',
      variant: 'danger',
    });
    if (confirmed) {
      this.store.dispatch(removeMenteeFromList({ menteeId: mentee.id }));
      this.toast.success(`Request from ${mentee.name} has been declined.`);
    }
  }
}
