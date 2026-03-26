import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, ElementRef,
  inject, OnDestroy, signal, ViewChild,
} from '@angular/core';
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
import { AuthApiService } from '../../../core/services/auth-api.service';
import { RealtimeService } from '../../../core/services/realtime.service';

const CONV_PAGE_SIZE = 10;
const TYPING_TIMEOUT_MS = 2500;
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

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
            <div class="flex-1">
              <h3 class="text-foreground font-medium">{{ sel.mentorName }}</h3>
              @if (otherIsTyping()) {
                <p class="text-xs text-primary animate-pulse">typing…</p>
              } @else {
                <p class="text-muted-foreground text-xs">Mentor</p>
              }
            </div>
            <button
              (click)="toggleChatSearch()"
              [class.text-primary]="chatSearchOpen()"
              class="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Search messages"
            >
              <fa-icon [icon]="['fas', 'magnifying-glass']" class="text-sm" />
            </button>
          </div>

          <!-- Chat Search Bar -->
          @if (chatSearchOpen()) {
            <div class="px-4 py-2 border-b border-border bg-card flex items-center gap-2">
              <fa-icon [icon]="['fas', 'magnifying-glass']" class="text-muted-foreground text-xs" />
              <input
                type="text"
                [ngModel]="chatSearchQuery()"
                (ngModelChange)="onChatSearchChange($event)"
                placeholder="Search in conversation..."
                class="flex-1 px-2 py-1 bg-input-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              @if (chatSearchQuery()) {
                <span class="text-xs text-muted-foreground">{{ filteredMessages().length }} found</span>
              }
              <button
                (click)="clearChatSearch()"
                class="p-1 text-muted-foreground hover:text-foreground"
                title="Clear search"
              >
                <fa-icon [icon]="['fas', 'xmark']" class="text-sm" />
              </button>
            </div>
          }

          <!-- Messages -->
          <div #messagesContainer class="flex-1 overflow-y-auto p-4 space-y-4">
            @for (msg of displayMessages(); track msg.id) {
              <div [class]="msg.senderRole === UserRole.Mentee ? 'flex justify-end' : 'flex justify-start'">
                <div
                  [class]="msg.senderRole === UserRole.Mentee
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'"
                  class="max-w-[70%] rounded-lg px-4 py-2"
                >
                  @if (msg.attachmentUrl && msg.attachmentType === 'image') {
                    <a [href]="msg.attachmentUrl" target="_blank" rel="noopener">
                      <img [src]="msg.attachmentUrl" alt="Attachment" class="max-w-full max-h-48 rounded mb-1 cursor-pointer" />
                    </a>
                  }
                  @if (msg.attachmentUrl && msg.attachmentType === 'pdf') {
                    <a
                      [href]="msg.attachmentUrl"
                      target="_blank"
                      rel="noopener"
                      class="flex items-center gap-2 mb-1 px-2 py-1.5 bg-black/10 rounded text-sm hover:bg-black/20 transition-colors"
                    >
                      <fa-icon [icon]="['fas', 'file-pdf']" class="text-base" />
                      <span class="truncate">{{ getFilenameFromUrl(msg.attachmentUrl) }}</span>
                    </a>
                  }
                  @if (msg.attachmentUrl && msg.attachmentType === 'doc') {
                    <a
                      [href]="msg.attachmentUrl"
                      target="_blank"
                      rel="noopener"
                      class="flex items-center gap-2 mb-1 px-2 py-1.5 bg-black/10 rounded text-sm hover:bg-black/20 transition-colors"
                    >
                      <fa-icon [icon]="['fas', 'file-lines']" class="text-base" />
                      <span class="truncate">{{ getFilenameFromUrl(msg.attachmentUrl) }}</span>
                    </a>
                  }
                  @if (msg.text) {
                    <p class="text-sm">{{ msg.text }}</p>
                  }
                  <p
                    [class]="msg.senderRole === UserRole.Mentee ? 'text-primary-foreground/70' : 'text-muted-foreground'"
                    class="text-xs mt-1"
                  >
                    {{ msg.timestamp }}
                  </p>
                </div>
              </div>
            }
            <!-- Typing bubble -->
            @if (otherIsTyping()) {
              <div class="flex justify-start">
                <div class="bg-muted rounded-lg px-4 py-2">
                  <span class="flex gap-1 items-center h-5">
                    <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style="animation-delay:0ms"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style="animation-delay:150ms"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style="animation-delay:300ms"></span>
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- Attachment preview -->
          @if (pendingFile()) {
            <div class="px-4 py-2 border-t border-border bg-card flex items-center gap-2">
              <fa-icon
                [icon]="['fas', pendingFileType() === 'image' ? 'image' : pendingFileType() === 'pdf' ? 'file-pdf' : 'file-lines']"
                class="text-primary"
              />
              <span class="text-sm text-foreground truncate flex-1">{{ pendingFile()!.name }}</span>
              <span class="text-xs text-muted-foreground">{{ formatFileSize(pendingFile()!.size) }}</span>
              <button (click)="clearPendingFile()" class="p-1 text-muted-foreground hover:text-destructive">
                <fa-icon [icon]="['fas', 'xmark']" class="text-sm" />
              </button>
            </div>
          }

          <!-- File error -->
          @if (fileError()) {
            <div class="px-4 py-1 bg-destructive/10 text-destructive text-xs">
              {{ fileError() }}
            </div>
          }

          <!-- Input -->
          <div class="p-4 border-t border-border bg-card">
            <div class="flex gap-3">
              <input
                #fileInput
                type="file"
                (change)="onFileSelected($event)"
                [accept]="acceptTypes"
                class="hidden"
              />
              <button
                (click)="fileInput.click()"
                [disabled]="uploading()"
                class="px-3 py-2.5 text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50"
                title="Attach file"
              >
                <fa-icon [icon]="['fas', 'paperclip']" />
              </button>
              <input
                type="text"
                [ngModel]="newMessage()"
                (ngModelChange)="onInputChange($event)"
                (keydown.enter)="sendMessage()"
                placeholder="Type a message..."
                class="flex-1 px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              <button
                (click)="sendMessage()"
                [disabled]="uploading()"
                class="px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {{ uploading() ? 'Uploading...' : 'Send' }}
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
export class MenteeMessagesPageComponent implements OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  private readonly store = inject(Store);
  private readonly authApi = inject(AuthApiService);
  private readonly realtime = inject(RealtimeService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly UserRole = UserRole;

  readonly conversations = this.store.selectSignal(selectMenteeConversationListItems);
  readonly selectedConversation = this.store.selectSignal(selectSelectedConversation);
  readonly currentUser = this.store.selectSignal(selectAuthUser);

  readonly convPageSize = CONV_PAGE_SIZE;
  convPage = signal(1);
  convSearchQuery = signal('');
  newMessage = signal('');
  otherIsTyping = signal(false);

  // File attachment state
  pendingFile = signal<File | null>(null);
  pendingFileType = signal<'image' | 'pdf' | 'doc'>('doc');
  uploading = signal(false);
  fileError = signal('');
  readonly acceptTypes = '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt';

  // Chat search state
  chatSearchOpen = signal(false);
  chatSearchQuery = signal('');

  private broadcastTyping: ((isTyping: boolean) => void) | null = null;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;
  private typingStopTimer: ReturnType<typeof setTimeout> | null = null;

  conversationsFiltered = computed(() => {
    const list = this.conversations();
    const q = this.convSearchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q),
    );
  });

  paginatedConversations = computed(() => {
    const list = this.conversationsFiltered();
    const start = (this.convPage() - 1) * this.convPageSize;
    return list.slice(start, start + this.convPageSize);
  });

  filteredMessages = computed(() => {
    const sel = this.selectedConversation();
    if (!sel) return [];
    const q = this.chatSearchQuery().toLowerCase().trim();
    if (!q) return sel.messages;
    return sel.messages.filter((m) => m.text.toLowerCase().includes(q));
  });

  displayMessages = computed(() => {
    const q = this.chatSearchQuery().toLowerCase().trim();
    if (!q || !this.chatSearchOpen()) {
      const sel = this.selectedConversation();
      return sel ? sel.messages : [];
    }
    return this.filteredMessages();
  });

  ngOnDestroy(): void {
    const sel = this.selectedConversation();
    if (sel) this.realtime.unsubscribeFromTyping(sel.id);
    if (this.typingTimer) clearTimeout(this.typingTimer);
    if (this.typingStopTimer) clearTimeout(this.typingStopTimer);
  }

  onConvSearchChange(value: string): void {
    this.convSearchQuery.set(value);
    this.convPage.set(1);
  }

  onConvPageChange(page: number): void {
    this.convPage.set(page);
  }

  selectConversation(conv: ConversationListItem): void {
    const prev = this.selectedConversation();
    if (prev) this.realtime.unsubscribeFromTyping(prev.id);
    this.store.dispatch(selectConversationAction({ conversationId: conv.id }));
    this.otherIsTyping.set(false);
    this.clearChatSearch();
    this.setupTypingChannel(conv.id);
  }

  private setupTypingChannel(conversationId: string): void {
    const user = this.currentUser();
    if (!user) return;
    this.broadcastTyping = this.realtime.subscribeToTyping(
      conversationId,
      user.id,
      (_, isTyping) => {
        this.otherIsTyping.set(isTyping);
        if (isTyping) {
          if (this.typingStopTimer) clearTimeout(this.typingStopTimer);
          this.typingStopTimer = setTimeout(() => {
            this.otherIsTyping.set(false);
            this.cdr.markForCheck();
          }, TYPING_TIMEOUT_MS + 500);
        }
        this.cdr.markForCheck();
      },
    );
  }

  onInputChange(value: string): void {
    this.newMessage.set(value);
    if (this.broadcastTyping && value.length > 0) {
      this.broadcastTyping(true);
      if (this.typingTimer) clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => {
        if (this.broadcastTyping) this.broadcastTyping(false);
      }, TYPING_TIMEOUT_MS);
    } else if (this.broadcastTyping && value.length === 0) {
      if (this.typingTimer) clearTimeout(this.typingTimer);
      this.broadcastTyping(false);
    }
  }

  // ─── File Attachment ──────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // reset so the same file can be re-selected
    if (!file) return;
    this.fileError.set('');
    if (file.size > MAX_FILE_SIZE) {
      this.fileError.set('File exceeds the 30 MB limit.');
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      this.fileError.set('Unsupported file type. Please attach an image, PDF, or document.');
      return;
    }
    this.pendingFile.set(file);
    this.pendingFileType.set(this.resolveFileType(file));
  }

  clearPendingFile(): void {
    this.pendingFile.set(null);
    this.fileError.set('');
  }

  private resolveFileType(file: File): 'image' | 'pdf' | 'doc' {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    return 'doc';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getFilenameFromUrl(url: string): string {
    try {
      const path = new URL(url).pathname;
      const name = path.split('/').pop() ?? 'attachment';
      // Strip the timestamp prefix (digits_)
      return name.replace(/^\d+_/, '');
    } catch {
      return 'attachment';
    }
  }

  // ─── Chat Search ──────────────────────────────────────────────────────

  toggleChatSearch(): void {
    const open = !this.chatSearchOpen();
    this.chatSearchOpen.set(open);
    if (!open) {
      this.chatSearchQuery.set('');
    }
  }

  onChatSearchChange(value: string): void {
    this.chatSearchQuery.set(value);
  }

  clearChatSearch(): void {
    this.chatSearchOpen.set(false);
    this.chatSearchQuery.set('');
  }

  // ─── Send Message ─────────────────────────────────────────────────────

  sendMessage(): void {
    const text = this.newMessage().trim();
    const file = this.pendingFile();
    const sel = this.selectedConversation();
    const user = this.currentUser();
    if ((!text && !file) || !sel || !user) return;

    if (file) {
      this.uploading.set(true);
      this.fileError.set('');
      const fileType = this.pendingFileType();
      this.authApi.uploadAttachment(sel.id, file).subscribe({
        next: (url) => {
          this.pendingFile.set(null);
          this.uploading.set(false);
          this.doSend(sel.id, user.id, text, url, fileType);
        },
        error: (err) => {
          this.uploading.set(false);
          this.fileError.set(err?.message ?? 'Failed to upload attachment.');
          this.cdr.markForCheck();
        },
      });
    } else {
      this.doSend(sel.id, user.id, text);
    }
  }

  private doSend(
    conversationId: string,
    userId: string,
    text: string,
    attachmentUrl?: string,
    attachmentType?: 'image' | 'pdf' | 'doc',
  ): void {
    this.newMessage.set('');
    if (this.broadcastTyping) this.broadcastTyping(false);
    if (this.typingTimer) clearTimeout(this.typingTimer);

    this.authApi.sendMessage(conversationId, userId, text, attachmentUrl, attachmentType).subscribe({
      next: () => {
        this.store.dispatch(
          sendChatMessage({
            conversationId,
            message: {
              senderId: userId,
              text: text || (attachmentUrl ? 'Sent an attachment' : ''),
              timestamp: 'Just now',
              ...(attachmentUrl ? { attachmentUrl, attachmentType } : {}),
            },
          }),
        );
        setTimeout(() => {
          const el = this.messagesContainer?.nativeElement;
          if (el) el.scrollTop = el.scrollHeight;
        }, 50);
      },
      error: () => {
        this.newMessage.set(text);
      },
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
