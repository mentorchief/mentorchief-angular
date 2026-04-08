import type { MentorStat, PendingMentorshipRequest, ActiveMenteeSummary, MentorEarning, MenteeListItem } from '../models/dashboard.model';

export const mentorSeedStats: MentorStat[] = [
  { label: 'Active Mentees', value: '12' },
  { label: 'Monthly Revenue', value: '$1,800' },
  { label: 'Total Earned', value: '$4,850' },
  { label: 'Avg. Rating', value: '4.9' },
];

export const mentorSeedPendingRequests: PendingMentorshipRequest[] = [
  { id: 1, name: 'Jordan Patel', goal: 'First PM Role', message: 'I want to transition into product management from software engineering...', rating: 4.3, menteeId: '17' },
  { id: 2, name: 'Emma Wilson', goal: 'Senior Role Prep', message: 'Looking for guidance on getting promoted to senior PM...', rating: null, menteeId: '7' },
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
  { month: 'December 2025', amount: 1320, status: 'Released', mentees: 9 },
  { month: 'November 2025', amount: 1260, status: 'Released', mentees: 9 },
  { month: 'October 2025', amount: 1180, status: 'Released', mentees: 8 },
  { month: 'September 2025', amount: 1120, status: 'Released', mentees: 8 },
  { month: 'August 2025', amount: 980, status: 'Released', mentees: 7 },
  { month: 'July 2025', amount: 940, status: 'Released', mentees: 7 },
  { month: 'June 2025', amount: 910, status: 'Released', mentees: 6 },
  { month: 'May 2025', amount: 850, status: 'Released', mentees: 6 },
  { month: 'April 2025', amount: 790, status: 'Released', mentees: 5 },
  { month: 'March 2025', amount: 720, status: 'Released', mentees: 5 },
];

export const mentorSeedMyMentees: MenteeListItem[] = [
  { id: 1, name: 'Alex Johnson', avatar: '', email: 'alex@example.com', plan: 'Monthly', startDate: 'Jan 15, 2026', progress: 75, status: 'active', subscriptionId: 'SUB-2-1-20260201', amount: 150 },
  { id: 2, name: 'Emma Wilson', avatar: '', email: 'emma@example.com', plan: 'Quarterly', startDate: 'Feb 1, 2026', progress: 45, status: 'active', subscriptionId: 'SUB-2-7-20260115', amount: 400 },
  { id: 3, name: 'Michael Brown', avatar: '', email: 'michael@example.com', plan: 'Monthly', startDate: 'Mar 1, 2026', progress: 10, status: 'active', subscriptionId: 'SUB-2-8-20260301', amount: 150 },
  { id: 5, name: 'Noah Carter', avatar: '', email: 'noah.carter@example.com', plan: 'Monthly', startDate: 'Dec 10, 2025', progress: 81, status: 'active' },
  { id: 6, name: 'Olivia Reed', avatar: '', email: 'olivia.reed@example.com', plan: 'Quarterly', startDate: 'Nov 5, 2025', progress: 54, status: 'active' },
  { id: 7, name: 'Ava Turner', avatar: '', email: 'ava.turner@example.com', plan: 'Monthly', startDate: 'Oct 14, 2025', progress: 68, status: 'active' },
  { id: 8, name: 'Ethan Brooks', avatar: '', email: 'ethan.brooks@example.com', plan: 'Monthly', startDate: 'Sep 1, 2025', progress: 72, status: 'active' },
  { id: 9, name: 'Grace Hall', avatar: '', email: 'grace.hall@example.com', plan: 'Quarterly', startDate: 'Aug 20, 2025', progress: 39, status: 'active' },
  { id: 10, name: 'Leo Price', avatar: '', email: 'leo.price@example.com', plan: 'Monthly', startDate: 'Jul 7, 2025', progress: 87, status: 'active' },
  { id: 11, name: 'Nina Park', avatar: '', email: 'nina.park@example.com', plan: 'Monthly', startDate: 'Jun 15, 2025', progress: 61, status: 'active' },
  { id: 12, name: 'Omar Diaz', avatar: '', email: 'omar.diaz@example.com', plan: 'Quarterly', startDate: 'May 2, 2025', progress: 49, status: 'active' },
  { id: 13, name: 'Ruby Stone', avatar: '', email: 'ruby.stone@example.com', plan: 'Monthly', startDate: 'Apr 11, 2025', progress: 76, status: 'active' },
  { id: 14, name: 'Victor Lane', avatar: '', email: 'victor.lane@example.com', plan: 'Monthly', startDate: 'Mar 8, 2025', progress: 64, status: 'active' },
  { id: 4, name: 'Sophie Lee', avatar: '', email: 'sophie@example.com', plan: 'Monthly', startDate: '-', progress: 0, status: 'pending' },
];

export const MENTOR_SEED = {
  stats: mentorSeedStats,
  pendingRequests: mentorSeedPendingRequests,
  activeMentees: mentorSeedActiveMentees,
  earnings: mentorSeedEarnings,
  myMentees: mentorSeedMyMentees,
};
