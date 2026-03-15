import { createAction, props } from '@ngrx/store';
import type { ChatConversation, ChatMessageCore } from '../../core/models/chat.model';

export const loadConversations = createAction(
  '[Messaging] Load Conversations',
  props<{ conversations: ChatConversation[]; mentorUnread?: Record<string, number> }>(),
);

export const selectConversation = createAction(
  '[Messaging] Select Conversation',
  props<{ conversationId: string | null }>(),
);

export const sendChatMessage = createAction(
  '[Messaging] Send Message',
  props<{ conversationId: string; message: Omit<ChatMessageCore, 'id'> }>(),
);

export const clearConversationUnread = createAction(
  '[Messaging] Clear Unread',
  props<{ conversationId: string }>(),
);

export const setMentorUnread = createAction(
  '[Messaging] Set Mentor Unread',
  props<{ conversationId: string; count: number }>(),
);

export const resetMessaging = createAction('[Messaging] Reset');
