import type { ActiveMentorship, MenteeSubscription, MenteePayment, ActiveMentorSummary, PastMentorSummary } from '../models/dashboard.model';

export const menteeSeedActiveMentorship: ActiveMentorship = {
  mentorId: '2',
  mentorName: 'Sarah Chen',
  mentorTitle: 'Senior PM',
  mentorCompany: 'Google',
  mentorImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
  monthsActive: 2,
  progress: 50,
};

export const menteeSeedSubscription: MenteeSubscription = {
  planName: 'Monthly Subscription',
  amount: 150,
  currency: 'USD',
  nextBillingDate: 'April 1, 2026',
  status: 'active',
  startedAt: '2026-03-10',
};

export const menteeSeedPayments: MenteePayment[] = [
  { id: '1', month: 'March 2026', amount: 150, status: 'in_escrow', releaseDate: 'Apr 1, 2026', paidToMentor: false },
  { id: '2', month: 'February 2026', amount: 150, status: 'released', paidToMentor: true },
  { id: '3', month: 'January 2026', amount: 150, status: 'released', paidToMentor: true },
  { id: '4', month: 'December 2025', amount: 120, status: 'released', paidToMentor: true },
  { id: '5', month: 'November 2025', amount: 120, status: 'released', paidToMentor: true },
  { id: '6', month: 'October 2025', amount: 120, status: 'released', paidToMentor: true },
  { id: '7', month: 'September 2025', amount: 100, status: 'released', paidToMentor: true },
  { id: '8', month: 'August 2025', amount: 100, status: 'released', paidToMentor: true },
  { id: '9', month: 'July 2025', amount: 100, status: 'released', paidToMentor: true },
  { id: '10', month: 'June 2025', amount: 100, status: 'released', paidToMentor: true },
  { id: '11', month: 'May 2025', amount: 95, status: 'released', paidToMentor: true },
  { id: '12', month: 'April 2025', amount: 95, status: 'released', paidToMentor: true },
];

export const menteeSeedActiveMentors: ActiveMentorSummary[] = [
  { id: 1, name: 'Sarah Chen', title: 'Senior PM', company: 'Google', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', startDate: 'Feb 1, 2026', price: 150, progress: 65 },
];

export const menteeSeedPastMentors: PastMentorSummary[] = [
  { id: 2, name: 'David Lee', title: 'Lead PM', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', startDate: 'Jun 1, 2025', endDate: 'Dec 15, 2025' },
  { id: 4, name: 'David Kim', title: 'Data Science Manager', image: 'https://images.unsplash.com/photo-1552345387-67b2f85f25c6?w=200', startDate: 'Jan 10, 2025', endDate: 'May 20, 2025' },
];

export const MENTEE_SEED = {
  activeMentorship: menteeSeedActiveMentorship,
  subscription: menteeSeedSubscription,
  payments: menteeSeedPayments,
  myMentors: {
    active: menteeSeedActiveMentors,
    past: menteeSeedPastMentors,
  },
};
