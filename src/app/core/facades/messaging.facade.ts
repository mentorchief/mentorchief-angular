import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { ChatConversation, ChatMessageCore, ConversationListItem } from '../models/chat.model';
import { UserRole } from '../models/user.model';
import { MessagingActions } from '../../store/messaging/messaging.actions';
import {
  selectMessagingState,
} from '../../store/messaging/messaging.selectors';
import { selectAllUsers } from '../../store/users/users.selectors';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MessagingFacade {
  private readonly store = inject(Store);

  readonly conversations$ = this.store.select(selectMessagingState).pipe(map((m) => m.conversations));
  readonly selectedId$ = this.store.select(selectMessagingState).pipe(map((m) => m.selectedId));
  readonly mentorUnread$ = this.store.select(selectMessagingState).pipe(map((m) => m.mentorUnread));

  private readonly messagingState$ = this.store.select(selectMessagingState);

  get conversations(): ChatConversation[] {
    let v: ChatConversation[] = [];
    this.messagingState$.subscribe((m) => (v = m.conversations)).unsubscribe();
    return v;
  }

  get selectedId(): string | null {
    let v: string | null = null;
    this.messagingState$.subscribe((m) => (v = m.selectedId)).unsubscribe();
    return v;
  }

  get mentorUnread(): Record<string, number> {
    let v: Record<string, number> = {};
    this.messagingState$.subscribe((m) => (v = m.mentorUnread)).unsubscribe();
    return v;
  }

  get selectedConversation(): ChatConversation | null {
    const id = this.selectedId;
    return id ? (this.conversations.find((c) => c.id === id) ?? null) : null;
  }

  selectConversation(id: string): void {
    this.store.dispatch(MessagingActions.selectConversation({ id }));
  }

  clearUnread(conversationId: string): void {
    this.store.dispatch(MessagingActions.clearUnread({ conversationId }));
  }

  sendMessage(conversationId: string, message: Omit<ChatMessageCore, 'id'>): void {
    this.store.dispatch(MessagingActions.sendMessage({ conversationId, message }));
  }

  getMentorConversations(userId: string): ChatConversation[] {
    return this.conversations.filter((c) => c.mentorId === userId);
  }

  getMenteeConversations(userId: string): ChatConversation[] {
    return this.conversations.filter((c) => c.menteeId === userId);
  }

  getConversationIdForMentee(mentorUserId: string, menteeIdOrName: string | number): string | null {
    const conv = this.getMentorConversations(mentorUserId).find(
      (c) => c.menteeId === String(menteeIdOrName) || c.menteeName === menteeIdOrName,
    );
    return conv?.id ?? null;
  }

  toListItems(
    convs: ChatConversation[],
    unreadByConv: Record<string, number>,
    nameField: 'menteeName' | 'mentorName',
  ): ConversationListItem[] {
    return convs.map((c) => ({
      id: c.id,
      name: c[nameField],
      avatar: '',
      lastMessage: c.lastMessage,
      timestamp: c.lastTimestamp,
      unread: (unreadByConv[c.id] ?? 0) > 0,
      unreadCount: unreadByConv[c.id] ?? 0,
    }));
  }
}
