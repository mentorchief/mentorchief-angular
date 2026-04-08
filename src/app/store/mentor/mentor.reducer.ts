import { createReducer, on } from '@ngrx/store';
import type {
  ActiveMenteeSummary,
  MenteeListItem,
  MentorNotificationSetting,
  MentorPayoutAccount,
} from '../../core/models/dashboard.model';
import { MENTOR_SEED } from '../../core/data/mentor.seed';
import { MentorActions } from './mentor.actions';

export interface MentorState {
  stats: typeof MENTOR_SEED.stats;
  pendingRequests: typeof MENTOR_SEED.pendingRequests;
  activeMentees: ActiveMenteeSummary[];
  earnings: typeof MENTOR_SEED.earnings;
  myMentees: MenteeListItem[];
  payoutAccount: MentorPayoutAccount;
  acceptingNewMentees: boolean;
  notificationSettings: MentorNotificationSetting[];
}

const DEFAULT_PAYOUT: MentorPayoutAccount = { type: 'bank', bankName: 'Chase Bank', accountNumber: '12345678842' };
const DEFAULT_NOTIFICATIONS: MentorNotificationSetting[] = [
  { id: 'requests', label: 'New Mentee Requests', description: 'Get notified when someone wants to join', enabled: true },
  { id: 'messages', label: 'Message Alerts', description: 'Notifications for new messages', enabled: true },
  { id: 'payments', label: 'Payment Updates', description: 'Escrow releases and earnings', enabled: true },
];

export const mentorInitialState: MentorState = {
  stats: MENTOR_SEED.stats,
  pendingRequests: MENTOR_SEED.pendingRequests,
  activeMentees: MENTOR_SEED.activeMentees,
  earnings: MENTOR_SEED.earnings,
  myMentees: MENTOR_SEED.myMentees,
  payoutAccount: DEFAULT_PAYOUT,
  acceptingNewMentees: true,
  notificationSettings: DEFAULT_NOTIFICATIONS,
};

export const mentorReducer = createReducer(
  mentorInitialState,
  on(MentorActions.addPendingRequest, (s, { request }): MentorState => ({
    ...s,
    pendingRequests: [...s.pendingRequests, request],
  })),
  on(MentorActions.setAcceptingNewMentees, (s, { accepting }): MentorState => ({ ...s, acceptingNewMentees: accepting })),
  on(MentorActions.setPayoutAccount, (s, { account }): MentorState => ({ ...s, payoutAccount: account })),
  on(MentorActions.acceptRequest, (s, { requestId }): MentorState => {
    const req = s.pendingRequests.find((r) => r.id === requestId);
    if (!req) return s;

    const createdMenteeId = req.menteeId ? Number(req.menteeId) : req.id;

    const newMentee: MenteeListItem = {
      id: createdMenteeId,
      name: req.name,
      avatar: '',
      email: '',
      plan: req.goal || 'Monthly',
      startDate: '-',
      progress: 0,
      status: 'approved_awaiting_payment',
    };
    return {
      ...s,
      pendingRequests: s.pendingRequests.filter((r) => r.id !== requestId),
      myMentees: [...s.myMentees, newMentee],
    };
  }),
  on(MentorActions.declineRequest, (s, { requestId }): MentorState => ({
    ...s,
    pendingRequests: s.pendingRequests.filter((r) => r.id !== requestId),
  })),
  on(MentorActions.acceptMentee, (s, { menteeId }): MentorState => ({
    ...s,
    myMentees: s.myMentees.map((m) => (m.id === menteeId ? { ...m, status: 'active' as const } : m)),
  })),
  on(MentorActions.removeMentee, (s, { menteeId }): MentorState => ({
    ...s,
    myMentees: s.myMentees.filter((m) => m.id !== menteeId),
    activeMentees: s.activeMentees.filter((m) => m.id !== menteeId),
  })),
  on(MentorActions.markMenteeCompleted, (s, { menteeId }): MentorState => ({
    ...s,
    myMentees: s.myMentees.map((m) => (m.id === menteeId ? { ...m, status: 'completed' as const } : m)),
    activeMentees: s.activeMentees.filter((m) => m.id !== menteeId),
    // Demo payout release: when admin approves final report, move first escrow bucket to released.
    earnings: (() => {
      let released = false;
      return s.earnings.map((e) => {
        if (!released && e.status === 'In Escrow') {
          released = true;
          return { ...e, status: 'Released' };
        }
        return e;
      });
    })(),
  })),
  on(MentorActions.updateMenteeStatus, (s, { menteeId, status, subscriptionId, amount }): MentorState => {
    const updated = s.myMentees.map((m) => {
      if (m.id !== menteeId) return m;
      const patched = { ...m, status };
      if (subscriptionId) patched.subscriptionId = subscriptionId;
      if (amount != null) patched.amount = amount;
      if (status === 'active') {
        patched.startDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return patched;
    });
    const activeMentees = status === 'active'
      ? [...s.activeMentees, ...updated.filter((m) => m.id === menteeId && m.status === 'active').map((m) => ({ id: m.id, name: m.name, goal: m.plan, progress: 0, monthsActive: 0 }))]
      : s.activeMentees;
    return { ...s, myMentees: updated, activeMentees };
  }),
);
