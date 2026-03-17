import type { UserRole } from './user.model';

/** Chat message core — stored in messaging slice. senderName/senderRole resolved via selector from users. */
export interface ChatMessageCore {
  id: number;
  senderId: string;
  text: string;
  timestamp: string;
}

/** Display type with sender info joined from users slice. */
export interface ChatMessage extends ChatMessageCore {
  senderName: string;
  senderRole: UserRole.Mentee | UserRole.Mentor;
}

/** Subscription details for a mentor-mentee pair. */
export interface ChatSubscription {
  planName: string;
  amount: number;
  status: 'active' | 'cancelled' | 'past';
  startDate: string;
  validUntil?: string;
}

/** Conversation core — stored in messaging slice. Names joined at selector level from users. */
export interface ChatConversationCore {
  id: string;
  mentorId: string;
  menteeId: string;
  lastMessage: string;
  lastTimestamp: string;
  status: 'active' | 'past';
  subscription?: ChatSubscription;
  messages: ChatMessageCore[];
}

/** Display type with names and enriched messages joined from users slice. */
export interface ChatConversation extends Omit<ChatConversationCore, 'messages'> {
  mentorName: string;
  menteeName: string;
  messages: ChatMessage[];
}

/** List item for mentor/mentee conversation list (derived from ChatConversation). */
export interface ConversationListItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  /** Mentor only: number of unread messages from this mentee. */
  unreadCount?: number;
}
