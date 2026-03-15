/** Chat message for admin review. */
export interface ChatMessage {
  id: number;
  senderId: string;
  senderName: string;
  senderRole: 'mentor' | 'mentee';
  text: string;
  timestamp: string;
}

/** Subscription details for a mentor-mentee pair. */
export interface ChatSubscription {
  planName: string;
  amount: number;
  status: 'active' | 'cancelled' | 'past';
  startDate: string;
  validUntil?: string;
}

/** Conversation between mentor and mentee. */
export interface ChatConversation {
  id: string;
  mentorId: string;
  mentorProfileId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  lastMessage: string;
  lastTimestamp: string;
  status: 'active' | 'past';
  subscription?: ChatSubscription;
  messages: ChatMessage[];
}

/** All platform conversations for admin review. */
export const ADMIN_CHATS: ChatConversation[] = [
  {
    id: 'conv-1',
    mentorId: '2',
    mentorProfileId: '1',
    mentorName: 'Sarah Chen',
    menteeId: '1',
    menteeName: 'Alex Johnson',
    lastMessage: "Great progress on your project! Let's discuss next steps.",
    lastTimestamp: '2:30 PM',
    status: 'active',
    subscription: { planName: 'Monthly', amount: 150, status: 'active', startDate: 'Feb 1, 2026', validUntil: 'Mar 1, 2026' },
    messages: [
      { id: 1, senderId: '2', senderName: 'Sarah Chen', senderRole: 'mentor', text: 'Hi! How are you doing with the project?', timestamp: '2:15 PM' },
      { id: 2, senderId: '1', senderName: 'Alex Johnson', senderRole: 'mentee', text: 'Going well! I finished the first module.', timestamp: '2:20 PM' },
      { id: 3, senderId: '2', senderName: 'Sarah Chen', senderRole: 'mentor', text: "Great progress on your project! Let's discuss next steps.", timestamp: '2:30 PM' },
    ],
  },
  {
    id: 'conv-2',
    mentorId: '2',
    mentorProfileId: '1',
    mentorName: 'Sarah Chen',
    menteeId: '7',
    menteeName: 'Emma Wilson',
    lastMessage: 'I completed the assignment.',
    lastTimestamp: 'Yesterday',
    status: 'active',
    subscription: { planName: 'Quarterly', amount: 400, status: 'active', startDate: 'Jan 15, 2026', validUntil: 'Apr 15, 2026' },
    messages: [
      { id: 1, senderId: '7', senderName: 'Emma Wilson', senderRole: 'mentee', text: 'Hi! I finished reviewing the materials you sent.', timestamp: '2:10 PM' },
      { id: 2, senderId: '2', senderName: 'Sarah Chen', senderRole: 'mentor', text: 'Great! What did you think about the architecture patterns?', timestamp: '2:15 PM' },
      { id: 3, senderId: '7', senderName: 'Emma Wilson', senderRole: 'mentee', text: 'Very helpful! I have some questions about the factory pattern.', timestamp: '2:25 PM' },
      { id: 4, senderId: '7', senderName: 'Emma Wilson', senderRole: 'mentee', text: 'I completed the assignment.', timestamp: 'Yesterday' },
    ],
  },
  {
    id: 'conv-3',
    mentorId: '2',
    mentorProfileId: '1',
    mentorName: 'Sarah Chen',
    menteeId: '8',
    menteeName: 'Michael Brown',
    lastMessage: 'Looking forward to our session.',
    lastTimestamp: 'Mon',
    status: 'active',
    subscription: { planName: 'Monthly', amount: 150, status: 'active', startDate: 'Mar 1, 2026', validUntil: 'Apr 1, 2026' },
    messages: [
      { id: 1, senderId: '8', senderName: 'Michael Brown', senderRole: 'mentee', text: 'Hi Sarah, when are you available this week?', timestamp: 'Mon 10:00 AM' },
      { id: 2, senderId: '2', senderName: 'Sarah Chen', senderRole: 'mentor', text: 'I have slots on Wednesday and Friday afternoon.', timestamp: 'Mon 10:15 AM' },
      { id: 3, senderId: '8', senderName: 'Michael Brown', senderRole: 'mentee', text: 'Looking forward to our session.', timestamp: 'Mon' },
    ],
  },
  {
    id: 'conv-4',
    mentorId: '9',
    mentorProfileId: '2',
    mentorName: 'David Lee',
    menteeId: '1',
    menteeName: 'Alex Johnson',
    lastMessage: 'The code review feedback looks good.',
    lastTimestamp: 'Mar 5',
    status: 'past',
    subscription: { planName: 'Monthly', amount: 120, status: 'past', startDate: 'Jan 10, 2026', validUntil: 'Mar 10, 2026' },
    messages: [
      { id: 1, senderId: '9', senderName: 'David Lee', senderRole: 'mentor', text: 'I reviewed your PR. Nice work on the error handling.', timestamp: 'Mar 4' },
      { id: 2, senderId: '1', senderName: 'Alex Johnson', senderRole: 'mentee', text: 'Thanks! Should I add more unit tests?', timestamp: 'Mar 4' },
      { id: 3, senderId: '9', senderName: 'David Lee', senderRole: 'mentor', text: 'Yes, especially for the edge cases we discussed.', timestamp: 'Mar 5' },
      { id: 4, senderId: '1', senderName: 'Alex Johnson', senderRole: 'mentee', text: 'The code review feedback looks good.', timestamp: 'Mar 5' },
    ],
  },
  {
    id: 'conv-5',
    mentorId: '9',
    mentorProfileId: '2',
    mentorName: 'David Lee',
    menteeId: '10',
    menteeName: 'Sophie Lee',
    lastMessage: 'Thanks for the session!',
    lastTimestamp: 'Feb 28',
    status: 'past',
    subscription: { planName: 'Monthly', amount: 120, status: 'past', startDate: 'Dec 1, 2025', validUntil: 'Feb 1, 2026' },
    messages: [
      { id: 1, senderId: '10', senderName: 'Sophie Lee', senderRole: 'mentee', text: 'Our session was really helpful.', timestamp: 'Feb 28' },
      { id: 2, senderId: '9', senderName: 'David Lee', senderRole: 'mentor', text: 'Glad to hear it. Keep practicing the patterns we covered.', timestamp: 'Feb 28' },
      { id: 3, senderId: '10', senderName: 'Sophie Lee', senderRole: 'mentee', text: 'Thanks for the session!', timestamp: 'Feb 28' },
    ],
  },
];
