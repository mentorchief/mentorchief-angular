import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import type { AppState } from '../../../store/app.state';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { ChatConversation } from '../../../core/models/chat.model';
import { UserRole } from '../../../core/models/user.model';
import { selectAdminConversations, selectSelectedConversation } from '../store/dashboard.selectors';
import { selectConversation } from '../store/dashboard.actions';

@Component({
  selector: 'mc-admin-messages-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-[calc(100vh-64px)] flex">
      <!-- Conversations List -->
      <div class="w-80 border-r border-border bg-card flex flex-col">
        <div class="p-4 border-b border-border">
          <h2 class="text-lg text-foreground font-medium">All Chats</h2>
          <p class="text-muted-foreground text-sm mt-1">Review active and past conversations</p>
          <div class="mt-3 flex gap-2">
            <button
              type="button"
              (click)="setFilter('all')"
              [class]="filterStatus() === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
              class="px-3 py-1.5 rounded-md text-sm font-medium"
            >
              All
            </button>
            <button
              type="button"
              (click)="setFilter('active')"
              [class]="filterStatus() === 'active' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
              class="px-3 py-1.5 rounded-md text-sm font-medium"
            >
              Active
            </button>
            <button
              type="button"
              (click)="setFilter('past')"
              [class]="filterStatus() === 'past' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
              class="px-3 py-1.5 rounded-md text-sm font-medium"
            >
              Past
            </button>
          </div>
          <div class="mt-3">
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search by mentor or mentee..."
              class="w-full px-3 py-2 bg-input-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>
        <div class="flex-1 overflow-y-auto">
          @for (conv of conversationsFiltered(); track conv.id) {
            <button
              type="button"
              (click)="onSelectConversation(conv)"
              [class.bg-muted]="selectedConversation()?.id === conv.id"
              class="w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border"
            >
              <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <span class="text-primary text-sm font-medium">{{ getInitials(conv.mentorName) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-foreground font-medium text-sm truncate">{{ conv.mentorName }} ↔ {{ conv.menteeName }}</span>
                  <span
                    [class]="conv.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'"
                    class="px-1.5 py-0.5 rounded text-xs shrink-0"
                  >
                    {{ conv.status }}
                  </span>
                </div>
                <p class="text-muted-foreground text-xs truncate mt-0.5">{{ conv.lastMessage }}</p>
                <p class="text-muted-foreground text-xs mt-0.5">{{ conv.lastTimestamp }}</p>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Chat Area (Read-only) -->
      <div class="flex-1 flex flex-col bg-background">
        @if (selectedConversation(); as sel) {
          <!-- Chat Header -->
          <div class="p-4 border-b border-border bg-card">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span class="text-primary font-medium">{{ getInitials(sel.mentorName) }}</span>
                </div>
                <div>
                  <h3 class="text-foreground font-medium">
                    <a [routerLink]="['/mentor', sel.mentorId]" target="_blank" class="text-primary hover:underline no-underline">{{ sel.mentorName }}</a>
                    <span class="text-muted-foreground font-normal"> (Mentor) ↔ </span>
                    <a routerLink="/dashboard/admin/users" class="text-primary hover:underline no-underline">{{ sel.menteeName }}</a>
                    <span class="text-muted-foreground font-normal"> (Mentee)</span>
                  </h3>
                  <p class="text-muted-foreground text-xs mt-0.5">
                    {{ sel.status === 'active' ? 'Active conversation' : 'Past conversation' }}
                  </p>
                </div>
              </div>
              <span
                [class]="sel.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'"
                class="px-2.5 py-1 rounded-md text-xs font-medium"
              >
                {{ sel.status }}
              </span>
            </div>
            @if (sel.subscription) {
              <div class="mt-3 pt-3 border-t border-border flex flex-wrap gap-4 text-sm">
                <span class="text-muted-foreground">
                  <strong class="text-foreground">Plan:</strong> {{ sel.subscription.planName }}
                </span>
                <span class="text-muted-foreground">
                  <strong class="text-foreground">Amount:</strong> \${{ sel.subscription.amount }}/mo
                </span>
                <span class="text-muted-foreground">
                  <strong class="text-foreground">Status:</strong>
                  <span [class]="sel.subscription.status === 'active' ? 'text-green-600' : 'text-muted-foreground'">
                    {{ sel.subscription.status }}
                  </span>
                </span>
                <span class="text-muted-foreground">
                  <strong class="text-foreground">Started:</strong> {{ sel.subscription.startDate }}
                </span>
                @if (sel.subscription.validUntil) {
                  <span class="text-muted-foreground">
                    <strong class="text-foreground">Valid until:</strong> {{ sel.subscription.validUntil }}
                  </span>
                }
              </div>
            }
          </div>

          <!-- Messages (Read-only) -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            @for (msg of sel.messages; track msg.id) {
              <div [class]="msg.senderRole === UserRole.Mentor ? 'flex justify-start' : 'flex justify-end'">
                <div
                  [class]="msg.senderRole === UserRole.Mentor
                    ? 'bg-muted text-foreground'
                    : 'bg-primary text-primary-foreground'"
                  class="max-w-[70%] rounded-lg px-4 py-2"
                >
                  <p class="text-xs font-medium opacity-80">{{ msg.senderName }} ({{ msg.senderRole }})</p>
                  <p class="text-sm mt-0.5">{{ msg.text }}</p>
                  <p
                    [class]="msg.senderRole === UserRole.Mentor ? 'text-muted-foreground' : 'text-primary-foreground/70'"
                    class="text-xs mt-1"
                  >
                    {{ msg.timestamp }}
                  </p>
                </div>
              </div>
            }
          </div>

          <div class="p-4 border-t border-border bg-muted/30 text-center text-sm text-muted-foreground">
            <fa-icon [icon]="['fas', 'eye']" class="w-4 h-4 mr-1" />
            Read-only view. Admin cannot send messages.
          </div>
        } @else {
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <fa-icon [icon]="['fas', 'message']" class="text-2xl w-8 h-8" />
              </div>
              <h3 class="text-foreground font-medium">Select a conversation</h3>
              <p class="text-muted-foreground text-sm mt-1">Choose a chat to review messages between mentor and mentee</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminMessagesPageComponent {
  private readonly store = inject(Store<AppState>);
  readonly UserRole = UserRole;

  readonly conversations = this.store.selectSignal(selectAdminConversations);
  readonly selectedConversation = this.store.selectSignal(selectSelectedConversation);
  searchQuery = signal('');
  filterStatus = signal<'all' | 'active' | 'past'>('all');

  conversationsFiltered = computed(() => {
    const raw = this.conversations();
    let list: ChatConversation[] = Array.isArray(raw) ? raw : [];
    const status = this.filterStatus();
    if (status === 'active') {
      list = list.filter((c) => c.status === 'active');
    } else if (status === 'past') {
      list = list.filter((c) => c.status === 'past');
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.mentorName.toLowerCase().includes(q) ||
        c.menteeName.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    );
  });

  setFilter(status: 'all' | 'active' | 'past'): void {
    this.filterStatus.set(status);
  }

  onSelectConversation(conv: ChatConversation): void {
    this.store.dispatch(selectConversation({ conversationId: conv.id }));
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
