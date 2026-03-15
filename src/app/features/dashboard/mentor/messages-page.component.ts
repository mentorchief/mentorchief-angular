import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PaginationComponent } from '../../../shared/components/pagination.component';

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface Message {
  id: number;
  senderId: string;
  text: string;
  timestamp: string;
}

const CONV_PAGE_SIZE = 10;

@Component({
  selector: 'mc-mentor-messages-page',
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
              [ngModel]="convSearchQuery"
              (ngModelChange)="onConvSearchChange($event)"
              placeholder="Search mentees..."
              class="w-full px-3 py-2 bg-input-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>
        <div class="flex-1 overflow-y-auto">
          @for (conv of paginatedConversations; track conv.id) {
            <button
              (click)="selectConversation(conv)"
              [class.bg-muted]="selectedConversation?.id === conv.id"
              class="w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border"
            >
              <div class="relative">
                <div class="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                  <span class="text-secondary-foreground text-sm font-medium">{{ getInitials(conv.name) }}</span>
                </div>
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
            [totalItems]="conversationsFiltered.length"
            [pageSize]="convPageSize"
            [currentPage]="convPage"
            (pageChange)="onConvPageChange($event)"
          />
        </div>
      </div>

      <!-- Chat Area -->
      <div class="flex-1 flex flex-col bg-background">
        @if (selectedConversation) {
          <!-- Chat Header -->
          <div class="p-4 border-b border-border bg-card flex items-center gap-3">
            <div class="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <span class="text-secondary-foreground font-medium">{{ getInitials(selectedConversation.name) }}</span>
            </div>
            <div>
              <h3 class="text-foreground font-medium">{{ selectedConversation.name }}</h3>
              <p class="text-muted-foreground text-xs">Mentee</p>
            </div>
          </div>

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            @for (msg of messages; track msg.id) {
              <div [class]="msg.senderId === 'me' ? 'flex justify-end' : 'flex justify-start'">
                <div
                  [class]="msg.senderId === 'me'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'"
                  class="max-w-[70%] rounded-lg px-4 py-2"
                >
                  <p class="text-sm">{{ msg.text }}</p>
                  <p
                    [class]="msg.senderId === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'"
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
                [(ngModel)]="newMessage"
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
              <p class="text-muted-foreground text-sm mt-1">Choose a mentee to start chatting</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorMessagesPageComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  readonly convPageSize = CONV_PAGE_SIZE;
  convPage = 1;
  convSearchQuery = '';

  get conversationsFiltered(): Conversation[] {
    const list = this.conversations;
    const q = this.convSearchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q)
    );
  }

  get paginatedConversations(): Conversation[] {
    const list = this.conversationsFiltered;
    const start = (this.convPage - 1) * this.convPageSize;
    return list.slice(start, start + this.convPageSize);
  }

  onConvSearchChange(value: string): void {
    this.convSearchQuery = value;
    this.convPage = 1;
    this.cdr.markForCheck();
  }

  onConvPageChange(page: number): void {
    this.convPage = page;
    this.cdr.markForCheck();
  }

  conversations: Conversation[] = [
    { id: 1, name: 'Alex Johnson', avatar: '', lastMessage: 'Thank you for the feedback!', timestamp: '2:30 PM', unread: true },
    { id: 2, name: 'Emma Wilson', avatar: '', lastMessage: 'I completed the assignment.', timestamp: 'Yesterday', unread: false },
    { id: 3, name: 'Michael Brown', avatar: '', lastMessage: 'Looking forward to our session.', timestamp: 'Mon', unread: false },
  ];

  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  newMessage = '';

  selectConversation(conv: Conversation): void {
    this.selectedConversation = conv;
    this.messages = [
      { id: 1, senderId: 'mentee', text: 'Hi! I finished reviewing the materials you sent.', timestamp: '2:10 PM' },
      { id: 2, senderId: 'me', text: 'Great! What did you think about the architecture patterns?', timestamp: '2:15 PM' },
      { id: 3, senderId: 'mentee', text: 'Very helpful! I have some questions about the factory pattern.', timestamp: '2:25 PM' },
      { id: 4, senderId: 'mentee', text: 'Thank you for the feedback!', timestamp: '2:30 PM' },
    ];
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.messages = [
        ...this.messages,
        { id: this.messages.length + 1, senderId: 'me', text: this.newMessage, timestamp: 'Just now' },
      ];
      this.newMessage = '';
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
