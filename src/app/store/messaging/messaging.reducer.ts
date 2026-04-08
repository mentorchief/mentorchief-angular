import { createReducer, on } from '@ngrx/store';
import type { ChatConversation } from '../../core/models/chat.model';
import { ADMIN_CHATS } from '../../core/data/chats.data';
import { MessagingActions } from './messaging.actions';

export interface MessagingState {
  conversations: ChatConversation[];
  selectedId: string | null;
  mentorUnread: Record<string, number>;
}

export const messagingInitialState: MessagingState = {
  conversations: [...ADMIN_CHATS],
  selectedId: null,
  mentorUnread: { 'conv-1': 1, 'conv-2': 2 },
};

export const messagingReducer = createReducer(
  messagingInitialState,
  on(MessagingActions.selectConversation, (s, { id }): MessagingState => ({ ...s, selectedId: id })),
  on(MessagingActions.clearUnread, (s, { conversationId }): MessagingState => {
    const next = { ...s.mentorUnread };
    delete next[conversationId];
    return { ...s, mentorUnread: next };
  }),
  on(MessagingActions.messageAppended, (s, { conversationId, message }): MessagingState => {
    const updated = s.conversations.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            messages: [...c.messages, message],
            lastMessage: message.text,
            lastTimestamp: 'Just now',
          }
        : c,
    );
    let mentorUnread = s.mentorUnread;
    const conv = s.conversations.find((c) => c.id === conversationId);
    const isFromMentee = conv && message.senderId === conv.menteeId;
    if (isFromMentee) {
      mentorUnread = {
        ...s.mentorUnread,
        [conversationId]: (s.mentorUnread[conversationId] ?? 0) + 1,
      };
    }
    return { ...s, conversations: updated, mentorUnread };
  }),
);
