import { createActionGroup, props } from '@ngrx/store';
import type { ChatMessage, ChatMessageCore } from '../../core/models/chat.model';

export const MessagingActions = createActionGroup({
  source: 'Messaging',
  events: {
    'Select Conversation': props<{ id: string | null }>(),
    'Clear Unread': props<{ conversationId: string }>(),
    'Send Message': props<{ conversationId: string; message: Omit<ChatMessageCore, 'id'> }>(),
    'Message Appended': props<{ conversationId: string; message: ChatMessage }>(),
  },
});
