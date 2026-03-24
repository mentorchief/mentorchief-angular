import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import type { AppState } from '../../../store/app.state';
import { selectPlatformUsers } from '../store/dashboard.selectors';
import { updateUserStatus } from '../store/dashboard.actions';
import { UserRole, MentorApprovalStatus, type User } from '../../../core/models/user.model';
import { AuthApiService } from '../../../core/services/auth-api.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'mc-admin-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="p-6 lg:p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl lg:text-3xl text-foreground">Users</h1>
          <p class="text-muted-foreground mt-1">Manage platform users</p>
        </div>
      </div>


      <!-- Filters -->
      <div class="bg-card rounded-lg border border-border p-4 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <input
            type="text"
            [ngModel]="searchQuery"
            (ngModelChange)="onSearchQueryChange($event)"
            placeholder="Search users..."
            class="flex-1 min-w-[200px] px-4 py-2 bg-input-background border border-border rounded-md"
          />
          <select
            [ngModel]="filterRole"
            (ngModelChange)="onFilterRoleChange($event)"
            class="px-4 py-2 bg-input-background border border-border rounded-md"
          >
            <option value="">All Roles</option>
            <option value="mentee">Mentees</option>
            <option value="mentor">Mentors</option>
            <option value="admin">Admins</option>
          </select>
          <select
            [ngModel]="filterStatus"
            (ngModelChange)="onFilterStatusChange($event)"
            class="px-4 py-2 bg-input-background border border-border rounded-md"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="not_registered">Not registered</option>
            <option value="pending_approval">Pending approval</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-card rounded-lg border border-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">User</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Role</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Joined</th>
                <th class="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of paginatedUsers; track user.id) {
                <tr class="border-b border-border last:border-0 hover:bg-muted/30">
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        <span class="text-secondary-foreground text-sm font-medium">{{ getInitials(user.name) }}</span>
                      </div>
                      <div>
                        <p class="text-foreground text-sm font-medium">{{ user.name }}</p>
                        <p class="text-muted-foreground text-xs">{{ user.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-4">
                    <span [class]="getRoleClass(user.role)" class="px-2.5 py-1 rounded-md text-xs capitalize">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex flex-wrap gap-1">
                      @if (user.status === 'suspended') {
                        <span class="px-2 py-0.5 rounded-md text-xs bg-destructive/10 text-destructive">Suspended</span>
                      } @else if (!user.registered) {
                        <span class="px-2 py-0.5 rounded-md text-xs bg-amber-100 text-amber-700">Not registered</span>
                      } @else if (user.role === 'mentor' && user.mentorApprovalStatus === 'pending') {
                        <span class="px-2 py-0.5 rounded-md text-xs bg-amber-100 text-amber-700">Pending approval</span>
                      } @else if (user.role === 'mentor' && user.mentorApprovalStatus === 'rejected') {
                        <span class="px-2 py-0.5 rounded-md text-xs bg-destructive/10 text-destructive">Rejected</span>
                      } @else {
                        <span class="px-2 py-0.5 rounded-md text-xs bg-green-100 text-green-700">Active</span>
                      }
                    </div>
                  </td>
                  <td class="px-5 py-4 text-sm text-muted-foreground">{{ user.joinDate ?? '—' }}</td>
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-2 flex-wrap">
                      @if (user.phone) {
                        <a
                          [href]="getWhatsAppUrl(user.phone)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white hover:opacity-90 transition-opacity"
                          style="background-color: #25D366"
                          title="Message {{ user.name }} on WhatsApp"
                        >
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.865 9.865 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          WhatsApp
                        </a>
                      }
                      <button
                        (click)="onToggleSuspend(user)"
                        class="px-3 py-1.5 border rounded-md text-sm hover:opacity-90"
                        [class]="user.status === 'suspended'
                          ? 'border-green-600 text-green-700 hover:bg-green-50'
                          : 'border-destructive/30 text-destructive hover:bg-destructive/10'"
                      >
                        {{ user.status === 'suspended' ? 'Activate' : 'Suspend' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="p-4">
          <mc-pagination
            [totalItems]="filteredUsers.length"
            [pageSize]="pageSize"
            [currentPage]="currentPage"
            (pageChange)="onPageChange($event)"
          />
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly authApi = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  /** Data from store (single platform user list). Component holds only filter/pagination UI state. */
  usersList: User[] = [];
  readonly pageSize = PAGE_SIZE;
  currentPage = 1;
  searchQuery = '';
  filterRole = '';
  filterStatus = '';


  ngOnInit(): void {
    const searchParam = this.route.snapshot.queryParamMap.get('search');
    if (searchParam) {
      this.searchQuery = searchParam;
    }
    this.store
      .select(selectPlatformUsers)
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
        this.usersList = Array.isArray(list) ? (list as User[]) : [];
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredUsers(): User[] {
    const q = this.searchQuery.toLowerCase().trim();
    const role = this.filterRole;
    const status = this.filterStatus;
    return this.usersList.filter((u) => {
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = !role || u.role === role;
      let matchStatus = true;
      if (status === 'suspended') matchStatus = u.status === 'suspended';
      else if (status === 'not_registered') matchStatus = u.status !== 'suspended' && !u.registered;
      else if (status === 'pending_approval') matchStatus = u.status !== 'suspended' && u.registered === true && u.role === UserRole.Mentor && u.mentorApprovalStatus === MentorApprovalStatus.Pending;
      else if (status === 'rejected') matchStatus = u.status !== 'suspended' && u.registered === true && u.role === UserRole.Mentor && u.mentorApprovalStatus === MentorApprovalStatus.Rejected;
      else if (status === 'active') matchStatus = u.status !== 'suspended' && u.registered === true && (u.role !== UserRole.Mentor || u.mentorApprovalStatus === MentorApprovalStatus.Approved);
      return matchSearch && matchRole && matchStatus;
    });
  }

  get paginatedUsers(): User[] {
    const list = this.filteredUsers;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  onFilterRoleChange(value: string): void {
    this.filterRole = value;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  onFilterStatusChange(value: string): void {
    this.filterStatus = value;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.cdr.markForCheck();
  }

  getWhatsAppUrl(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    const text = encodeURIComponent('Hi, this is MentorChief admin. How can we help?');
    return `https://wa.me/${digits}?text=${text}`;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleClass(role: UserRole): string {
    switch (role) {
      case UserRole.Mentor: return 'bg-purple-100 text-purple-700';
      case UserRole.Mentee: return 'bg-blue-100 text-blue-700';
      case UserRole.Admin: return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  }

  getStatusClass(status: 'active' | 'suspended' | 'pending'): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'suspended': return 'bg-destructive/10 text-destructive';
      case 'pending': return 'bg-amber-100 text-amber-700';
    }
  }


  async onToggleSuspend(user: User): Promise<void> {
    const isSuspending = user.status !== 'suspended';
    const confirmed = await this.confirmDialog.confirm({
      title: isSuspending ? 'Suspend User' : 'Activate User',
      message: isSuspending
        ? `Are you sure you want to suspend ${user.name}? They will lose access to the platform until reactivated.`
        : `Are you sure you want to activate ${user.name}? They will regain full access to the platform.`,
      confirmLabel: isSuspending ? 'Suspend' : 'Activate',
      cancelLabel: 'Cancel',
      variant: isSuspending ? 'danger' : 'primary',
    });
    if (!confirmed) return;
    const newStatus = isSuspending ? 'suspended' as const : 'active' as const;
    this.authApi.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        this.store.dispatch(updateUserStatus({ userId: user.id, status: newStatus }));
        this.toast.success(isSuspending ? `${user.name} has been suspended.` : `${user.name} has been activated.`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error(`Failed to ${isSuspending ? 'suspend' : 'activate'} ${user.name}. Please try again.`);
      },
    });
  }
}
