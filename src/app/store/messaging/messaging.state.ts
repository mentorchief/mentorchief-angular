import { createEntityAdapter, type EntityState } from '@ngrx/entity';
import type { ChatConversationCore } from '../../core/models/chat.model';

export const conversationsAdapter = createEntityAdapter<ChatConversationCore>({
  selectId: (c: ChatConversationCore) => c.id,
  sortComparer: (a: ChatConversationCore, b: ChatConversationCore) => b.lastTimestamp.localeCompare(a.lastTimestamp),
});

export interface MessagingState extends EntityState<ChatConversationCore> {
  selectedConversationId: string | null;
  mentorUnreadByConversation: Record<string, number>;
}

export const messagingInitialState: MessagingState = conversationsAdapter.getInitialState({
  selectedConversationId: null,
  mentorUnreadByConversation: {},
});
