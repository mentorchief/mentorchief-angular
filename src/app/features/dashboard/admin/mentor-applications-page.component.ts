import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import type { User } from '../../../core/models/user.model';

@Component({
  selector: 'mc-admin-mentor-applications-page',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">Mentor Applications</h1>
        <p class="text-muted-foreground mt-1">Review and approve or reject new mentor applications.</p>
      </div>

      @if (loading) {
        <div class="flex items-center justify-center py-12">
          <p class="text-muted-foreground">Loading...</p>
        </div>
      } @else if (pendingMentors.length === 0) {
        <div class="bg-card rounded-lg border border-border p-12 text-center">
          <div class="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <fa-icon [icon]="['fas', 'check']" class="text-xl text-muted-foreground" />
          </div>
          <h2 class="text-lg font-semibold text-foreground">No pending applications</h2>
          <p class="text-muted-foreground mt-2 text-sm">All mentor applications have been reviewed.</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (user of pendingMentors; track user.id) {
            <div class="bg-card rounded-lg border border-border overflow-hidden">
              <div class="p-5 flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span class="text-primary-foreground font-medium">{{ getInitials(user.name) }}</span>
                  </div>
                  <div>
                    <p class="font-medium text-foreground">{{ user.name }}</p>
                    <p class="text-sm text-muted-foreground">{{ user.email }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="toggleDetails(user)"
                    class="px-4 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-muted"
                  >
                    {{ detailsUser?.id === user.id ? 'Hide Details' : 'Details' }}
                  </button>
                  <button
                    type="button"
                    (click)="approve(user)"
                    [disabled]="actionInProgress === user.id"
                    class="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {{ actionInProgress === user.id ? '…' : 'Approve' }}
                  </button>
                  <button
                    type="button"
                    (click)="reject(user)"
                    [disabled]="actionInProgress === user.id"
                    class="px-4 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
              @if (detailsUser?.id === user.id) {
                <div class="border-t border-border bg-muted/30 p-5">
                  <h3 class="text-sm font-medium text-foreground mb-4">Registration Data</h3>
                  <div class="grid sm:grid-cols-2 gap-4 text-sm">
                    @if (user.jobTitle) {
                      <div>
                        <span class="text-muted-foreground">Title</span>
                        <p class="text-foreground font-medium">{{ user.jobTitle }}</p>
                      </div>
                    }
                    @if (user.company) {
                      <div>
                        <span class="text-muted-foreground">Company</span>
                        <p class="text-foreground font-medium">{{ user.company }}</p>
                      </div>
                    }
                    @if (user.yearsOfExperience) {
                      <div>
                        <span class="text-muted-foreground">Experience</span>
                        <p class="text-foreground font-medium">{{ user.yearsOfExperience }} years</p>
                      </div>
                    }
                    @if (user.location) {
                      <div>
                        <span class="text-muted-foreground">Location</span>
                        <p class="text-foreground font-medium">{{ user.location }}</p>
                      </div>
                    }
                    @if (user.phone) {
                      <div>
                        <span class="text-muted-foreground">Phone</span>
                        <p class="text-foreground font-medium">{{ user.phone }}</p>
                      </div>
                    }
                    @if (user.joinDate) {
                      <div>
                        <span class="text-muted-foreground">Applied</span>
                        <p class="text-foreground font-medium">{{ user.joinDate }}</p>
                      </div>
                    }
                  </div>
                  @if (user.bio) {
                    <div class="mt-4">
                      <span class="text-muted-foreground text-sm">Bio</span>
                      <p class="text-foreground mt-1">{{ user.bio }}</p>
                    </div>
                  }
                  @if (user.skills?.length) {
                    <div class="mt-4">
                      <span class="text-muted-foreground text-sm">Skills</span>
                      <div class="flex flex-wrap gap-2 mt-1">
                        @for (skill of user.skills; track skill) {
                          <span class="px-2 py-1 bg-primary/10 text-primary rounded text-xs">{{ skill }}</span>
                        }
                      </div>
                    </div>
                  }
                  @if (user.linkedin || user.portfolioUrl) {
                    <div class="mt-4 flex flex-wrap gap-3">
                      @if (user.linkedin) {
                        <a
                          [href]="user.linkedin"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-2 text-sm text-[#0A66C2] hover:underline no-underline"
                        >
                          <fa-icon [icon]="['fab', 'linkedin']" class="w-4 h-4" />
                          LinkedIn
                        </a>
                      }
                      @if (user.portfolioUrl) {
                        <a
                          [href]="user.portfolioUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-2 text-sm text-primary hover:underline no-underline"
                        >
                          <fa-icon [icon]="['fas', 'link']" class="w-4 h-4" />
                          Portfolio
                        </a>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminMentorApplicationsPageComponent implements OnInit {
  private readonly authApi = inject(AuthApiService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly cdr = inject(ChangeDetectorRef);

  pendingMentors: User[] = [];
  loading = true;
  actionInProgress: string | null = null;
  detailsUser: User | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.authApi.getPendingMentors().subscribe({
      next: (list) => {
        this.pendingMentors = list;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleDetails(user: User): void {
    this.detailsUser = this.detailsUser?.id === user.id ? null : user;
    this.cdr.markForCheck();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  approve(user: User): void {
    this.actionInProgress = user.id;
    this.cdr.markForCheck();
    this.authApi.approveMentor(user.id).subscribe({
      next: () => {
        this.actionInProgress = null;
        this.pendingMentors = this.pendingMentors.filter((u) => u.id !== user.id);
        this.toast.success(`${user.name} has been approved as a mentor.`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.actionInProgress = null;
        this.toast.error('Failed to approve. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }

  async reject(user: User): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Reject application',
      message: `Reject ${user.name} as a mentor? They will see a rejected status when they next sign in.`,
      confirmLabel: 'Reject',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.actionInProgress = user.id;
    this.cdr.markForCheck();
    this.authApi.rejectMentor(user.id).subscribe({
      next: () => {
        this.actionInProgress = null;
        this.pendingMentors = this.pendingMentors.filter((u) => u.id !== user.id);
        this.toast.success(`${user.name}'s application has been rejected.`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.actionInProgress = null;
        this.toast.error('Failed to reject. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }
}
