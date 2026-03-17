import { createReducer, on } from '@ngrx/store';
import type { ChatConversation, ChatConversationCore, ChatMessage, ChatMessageCore } from '../../core/models/chat.model';
import {
  clearConversationUnread,
  loadConversations,
  resetMessaging,
  selectConversation,
  sendChatMessage,
  setMentorUnread,
} from './messaging.actions';
import { conversationsAdapter } from './messaging.state';
import { messagingInitialState } from './messaging.state';

function toMessageCore(m: ChatMessage | ChatMessageCore): ChatMessageCore {
  const { senderName, senderRole, ...rest } = m as ChatMessage;
  return rest;
}

export function toConversationCore(c: ChatConversation): ChatConversationCore {
  const { mentorName, menteeName, ...rest } = c;
  return {
    ...rest,
    messages: rest.messages.map(toMessageCore),
  };
}

export const messagingReducer = createReducer(
  messagingInitialState,
  on(loadConversations, (state, { conversations, mentorUnread }) =>
    conversationsAdapter.setAll(conversations.map(toConversationCore), {
      ...messagingInitialState,
      mentorUnreadByConversation: mentorUnread ?? state.mentorUnreadByConversation,
    }),
  ),
  on(resetMessaging, () => messagingInitialState),
  on(selectConversation, (state, { conversationId }) => ({
    ...state,
    selectedConversationId: conversationId,
  })),
  on(sendChatMessage, (state, { conversationId, message }) => {
    const conv = state.entities[conversationId];
    if (!conv) return state;
    const nextId = conv.messages.length ? Math.max(...conv.messages.map((m: ChatMessageCore) => m.id)) + 1 : 1;
    const newMessage: ChatMessageCore = { ...message, id: nextId };
    const updatedConv: ChatConversationCore = {
      ...conv,
      messages: [...conv.messages, newMessage],
      lastMessage: message.text,
      lastTimestamp: 'Just now',
    };
    const isFromMentee = message.senderId === conv.menteeId;
    const newUnread = isFromMentee
      ? { ...state.mentorUnreadByConversation, [conversationId]: (state.mentorUnreadByConversation[conversationId] ?? 0) + 1 }
      : state.mentorUnreadByConversation;
    return conversationsAdapter.updateOne(
      { id: conversationId, changes: updatedConv },
      { ...state, mentorUnreadByConversation: newUnread },
    );
  }),
  on(clearConversationUnread, (state, { conversationId }) => {
    const next = { ...state.mentorUnreadByConversation };
    delete next[conversationId];
    return { ...state, mentorUnreadByConversation: next };
  }),
  on(setMentorUnread, (state, { conversationId, count }) => ({
    ...state,
    mentorUnreadByConversation: { ...state.mentorUnreadByConversation, [conversationId]: count },
  })),
);
