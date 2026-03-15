import type {
  MentorStat,
  PendingMentorshipRequest,
  ActiveMenteeSummary,
  MentorEarning,
  MentorPayoutAccount,
  MentorNotificationSetting,
  MenteeListItem,
} from '../../core/models/dashboard.model';

export interface MentorState {
  stats: MentorStat[];
  pendingRequests: PendingMentorshipRequest[];
  activeMentees: ActiveMenteeSummary[];
  earnings: MentorEarning[];
  myMentees: MenteeListItem[];
  payoutAccount: MentorPayoutAccount;
  acceptingNewMentees: boolean;
  notificationSettings: MentorNotificationSetting[];
}

export const defaultPayoutAccount: MentorPayoutAccount = {
  type: 'bank',
  bankName: 'Chase Bank',
  accountNumber: '12345678842',
};

export const defaultNotificationSettings: MentorNotificationSetting[] = [
  { id: 'requests', label: 'New Mentee Requests', description: 'Get notified when someone wants to join', enabled: true },
  { id: 'messages', label: 'Message Alerts', description: 'Notifications for new messages', enabled: true },
  { id: 'payments', label: 'Payment Updates', description: 'Escrow releases and earnings', enabled: true },
];

export const mentorInitialState: MentorState = {
  stats: [],
  pendingRequests: [],
  activeMentees: [],
  earnings: [],
  myMentees: [],
  payoutAccount: defaultPayoutAccount,
  acceptingNewMentees: true,
  notificationSettings: defaultNotificationSettings,
};
