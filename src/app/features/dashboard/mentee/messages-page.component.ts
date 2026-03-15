import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import type { ConversationListItem } from '../../../core/models/chat.model';
import { UserRole } from '../../../core/models/user.model';
import {
  selectMenteeConversationListItems,
  selectSelectedConversation,
} from '../store/dashboard.selectors';
import { selectConversation as selectConversationAction, sendChatMessage } from '../store/dashboard.actions';
import { selectAuthUser } from '../../auth/store/auth.selectors';

const CONV_PAGE_SIZE = 10;

@Component({
  selector: 'mc-mentee-messages-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, PaginationComponent],
  template: `
    <div class="h-[calc(100vh-64px)] flex">
      <!-- Conversations List -->
      <div class="w-80 border-r border-border bg-card flex flex-col">
        <div class="p-4 border-b border-border">
          <h2 class="text-lg text-foreground font-medium">Messages</h2>
          <div class="mt-3">
            <input
              type="text"
              [ngModel]="convSearchQuery()"
              (ngModelChange)="onConvSearchChange($event)"
              placeholder="Search conversations..."
              class="w-full px-3 py-2 bg-input-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>
        <div class="flex-1 overflow-y-auto">
          @for (conv of paginatedConversations(); track conv.id) {
            <button
              (click)="selectConversation(conv)"
              [class.bg-muted]="selectedConversation()?.id === conv.id"
              class="w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border"
            >
              <div class="relative">
                @if (conv.avatar) {
                  <img [src]="conv.avatar" [alt]="conv.name" class="w-10 h-10 rounded-full object-cover" />
                } @else {
                  <div class="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <span class="text-secondary-foreground text-sm font-medium">{{ getInitials(conv.name) }}</span>
                  </div>
                }
                @if (conv.unread) {
                  <span class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-card"></span>
                }
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-foreground font-medium text-sm">{{ conv.name }}</span>
                  <span class="text-muted-foreground text-xs">{{ conv.timestamp }}</span>
                </div>
                <p class="text-muted-foreground text-sm truncate mt-0.5">{{ conv.lastMessage }}</p>
              </div>
            </button>
          }
        </div>
        <div class="p-3 border-t border-border shrink-0">
          <mc-pagination
            [totalItems]="conversationsFiltered().length"
            [pageSize]="convPageSize"
            [currentPage]="convPage()"
            (pageChange)="onConvPageChange($event)"
          />
        </div>
      </div>

      <!-- Chat Area -->
      <div class="flex-1 flex flex-col bg-background">
        @if (selectedConversation(); as sel) {
          <!-- Chat Header -->
          <div class="p-4 border-b border-border bg-card flex items-center gap-3">
            <div class="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <span class="text-secondary-foreground font-medium">{{ getInitials(sel.mentorName) }}</span>
            </div>
            <div>
              <h3 class="text-foreground font-medium">{{ sel.mentorName }}</h3>
              <p class="text-muted-foreground text-xs">Mentor</p>
            </div>
          </div>

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            @for (msg of sel.messages; track msg.id) {
              <div [class]="msg.senderRole === UserRole.Mentee ? 'flex justify-end' : 'flex justify-start'">
                <div
                  [class]="msg.senderRole === UserRole.Mentee
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'"
                  class="max-w-[70%] rounded-lg px-4 py-2"
                >
                  <p class="text-sm">{{ msg.text }}</p>
                  <p
                    [class]="msg.senderRole === UserRole.Mentee ? 'text-primary-foreground/70' : 'text-muted-foreground'"
                    class="text-xs mt-1"
                  >
                    {{ msg.timestamp }}
                  </p>
                </div>
              </div>
            }
          </div>

          <!-- Input -->
          <div class="p-4 border-t border-border bg-card">
            <div class="flex gap-3">
              <input
                type="text"
                [ngModel]="newMessage()"
                (ngModelChange)="newMessage.set($event)"
                (keydown.enter)="sendMessage()"
                placeholder="Type a message..."
                class="flex-1 px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              <button
                (click)="sendMessage()"
                class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Send
              </button>
            </div>
          </div>
        } @else {
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <fa-icon [icon]="['fas', 'message']" class="text-2xl w-8 h-8" />
              </div>
              <h3 class="text-foreground font-medium">Select a conversation</h3>
              <p class="text-muted-foreground text-sm mt-1">Choose a mentor to start chatting</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenteeMessagesPageComponent {
  private readonly store = inject(Store);
  readonly UserRole = UserRole;

  readonly conversations = this.store.selectSignal(selectMenteeConversationListItems);
  readonly selectedConversation = this.store.selectSignal(selectSelectedConversation);
  readonly currentUser = this.store.selectSignal(selectAuthUser);

  readonly convPageSize = CONV_PAGE_SIZE;
  convPage = signal(1);
  convSearchQuery = signal('');
  newMessage = signal('');

  conversationsFiltered = computed(() => {
    const list = this.conversations();
    const q = this.convSearchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q),
    );
  });

  paginatedConversations = computed(() => {
    const list = this.conversationsFiltered();
    const start = (this.convPage() - 1) * this.convPageSize;
    return list.slice(start, start + this.convPageSize);
  });

  onConvSearchChange(value: string): void {
    this.convSearchQuery.set(value);
    this.convPage.set(1);
  }

  onConvPageChange(page: number): void {
    this.convPage.set(page);
  }

  selectConversation(conv: ConversationListItem): void {
    this.store.dispatch(selectConversationAction({ conversationId: conv.id }));
  }

  sendMessage(): void {
    const text = this.newMessage().trim();
    const sel = this.selectedConversation();
    const user = this.currentUser();
    if (!text || !sel || !user) return;
    this.store.dispatch(
      sendChatMessage({
        conversationId: sel.id,
        message: {
          senderId: user.id,
          text,
          timestamp: 'Just now',
        },
      }),
    );
    this.newMessage.set('');
  }

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
