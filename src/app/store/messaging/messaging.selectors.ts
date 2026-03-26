import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { Dictionary } from '@ngrx/entity';
import type { ChatConversation, ChatConversationCore, ChatMessage, ChatMessageCore } from '../../core/models/chat.model';
import type { User } from '../../core/models/user.model';
import { UserRole } from '../../core/models/user.model';
import type { MessagingState } from './messaging.state';
import { conversationsAdapter } from './messaging.state';
import { selectUserEntities } from '../users/users.selectors';

export const selectMessagingState = createFeatureSelector<MessagingState>('messaging');

const { selectAll, selectEntities } = conversationsAdapter.getSelectors();

export const selectAllConversationsCore = createSelector(
  selectMessagingState,
  (state: MessagingState): ChatConversationCore[] => selectAll(state),
);

function enrichMessages(
  messages: ChatMessageCore[],
  mentorId: string,
  menteeId: string,
  userEntities: Dictionary<User>,
): ChatMessage[] {
  return messages.map((m) => {
    const sender = userEntities[m.senderId];
    const senderRole = m.senderId === mentorId ? UserRole.Mentor : UserRole.Mentee;
    return {
      ...m,
      senderName: sender?.name ?? 'Unknown',
      senderRole,
    };
  });
}

/** Conversations with mentor/mentee names and message sender info joined from users slice. */
export const selectAllConversations = createSelector(
  selectAllConversationsCore,
  selectUserEntities,
  (convs: ChatConversationCore[], entities): ChatConversation[] =>
    convs.map((c) => ({
      ...c,
      mentorName: entities[c.mentorId]?.name ?? 'Unknown',
      menteeName: entities[c.menteeId]?.name ?? 'Unknown',
      messages: enrichMessages(c.messages, c.mentorId, c.menteeId, entities),
    })),
);

export const selectConversationEntities = createSelector(
  selectMessagingState,
  (state: MessagingState): Dictionary<ChatConversationCore> => selectEntities(state),
);

export const selectSelectedConversationId = createSelector(
  selectMessagingState,
  (s) => s.selectedConversationId,
);

export const selectMentorUnreadByConversation = createSelector(
  selectMessagingState,
  (s) => s.mentorUnreadByConversation ?? {},
);

/** Selected conversation with names and message sender info joined from users. */
export const selectSelectedConversation = createSelector(
  selectConversationEntities,
  selectSelectedConversationId,
  selectUserEntities,
  (entities: Dictionary<ChatConversationCore>, id: string | null, userEntities): ChatConversation | null => {
    if (!id) return null;
    const c = entities[id];
    if (!c) return null;
    console.log(c, userEntities[c.mentorId]?.name)
    return {
      ...c,
      mentorName: userEntities[c.mentorId]?.name ?? 'Unknown',
      menteeName: userEntities[c.menteeId]?.name ?? 'Unknown',
      messages: enrichMessages(c.messages, c.mentorId, c.menteeId, userEntities),
    };
  },
);

export const selectConversationById = (id: string) =>
  createSelector(
    selectConversationEntities,
    selectUserEntities,
    (entities: Dictionary<ChatConversationCore>, userEntities): ChatConversation | null => {
      const c = entities[id];
      if (!c) return null;
      return {
        ...c,
        mentorName: userEntities[c.mentorId]?.name ?? 'Unknown',
        menteeName: userEntities[c.menteeId]?.name ?? 'Unknown',
        messages: enrichMessages(c.messages, c.mentorId, c.menteeId, userEntities),
      };
    },
  );
