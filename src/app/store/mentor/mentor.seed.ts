import type { MentorStat, PendingMentorshipRequest, ActiveMenteeSummary, MentorEarning, MenteeListItem } from '../../core/models/dashboard.model';

export const mentorSeedStats: MentorStat[] = [
  { label: 'Active Mentees', value: '12' },
  { label: 'Monthly Revenue', value: '$1,800' },
  { label: 'Total Earned', value: '$4,850' },
  { label: 'Avg. Rating', value: '4.9' },
];

export const mentorSeedPendingRequests: PendingMentorshipRequest[] = [
  { id: 1, name: 'Jordan Patel', goal: 'First PM Role', message: 'I want to transition into product management from software engineering...', rating: 4.3 },
  { id: 2, name: 'Emma Wilson', goal: 'Senior Role Prep', message: 'Looking for guidance on getting promoted to senior PM...', rating: null },
];

export const mentorSeedActiveMentees: ActiveMenteeSummary[] = [
  { id: 1, name: 'Alex Thompson', goal: 'PM Career Transition', progress: 75, monthsActive: 2 },
  { id: 2, name: 'Maya Johnson', goal: 'Product Strategy Skills', progress: 45, monthsActive: 1 },
  { id: 3, name: 'Chris Lee', goal: 'Senior PM Promotion', progress: 90, monthsActive: 3 },
];

export const mentorSeedEarnings: MentorEarning[] = [
  { month: 'March 2026', amount: 1800, status: 'In Escrow', mentees: 12 },
  { month: 'February 2026', amount: 1650, status: 'Released', mentees: 11 },
  { month: 'January 2026', amount: 1400, status: 'Released', mentees: 10 },
];

export const mentorSeedMyMentees: MenteeListItem[] = [
  { id: 1, name: 'Alex Johnson', avatar: '', email: 'alex@example.com', plan: 'Monthly', startDate: 'Jan 15, 2026', progress: 75, status: 'active' },
  { id: 2, name: 'Emma Wilson', avatar: '', email: 'emma@example.com', plan: 'Quarterly', startDate: 'Feb 1, 2026', progress: 45, status: 'active' },
  { id: 3, name: 'Michael Brown', avatar: '', email: 'michael@example.com', plan: 'Monthly', startDate: 'Mar 1, 2026', progress: 10, status: 'active' },
  { id: 4, name: 'Sophie Lee', avatar: '', email: 'sophie@example.com', plan: 'Monthly', startDate: '-', progress: 0, status: 'pending' },
];

export const MENTOR_SEED = {
  stats: mentorSeedStats,
  pendingRequests: mentorSeedPendingRequests,
  activeMentees: mentorSeedActiveMentees,
  earnings: mentorSeedEarnings,
  myMentees: mentorSeedMyMentees,
};
