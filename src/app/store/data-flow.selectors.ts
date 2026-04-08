import { createSelector } from '@ngrx/store';
import { UserRole } from '../core/models/user.model';
import { selectAllSubscriptions } from './subscriptions/subscriptions.selectors';
import { selectAllUsers } from './users/users.selectors';
import { selectMentorProfileReviews, selectMenteeReports } from './reports/reports.selectors';
import { selectMessagingState } from './messaging/messaging.selectors';
import { MENTORS } from '../core/data/mentors.data';

export const selectSubscriptionsByMentorId = (mentorId: string) =>
  createSelector(selectAllSubscriptions, (items) => items.filter((s) => s.mentorId === mentorId));

export const selectSubscriptionsByMenteeId = (menteeId: string) =>
  createSelector(selectAllSubscriptions, (items) => items.filter((s) => s.menteeId === menteeId));

export const selectActiveSubscriptionsByMentorId = (mentorId: string) =>
  createSelector(selectSubscriptionsByMentorId(mentorId), (items) =>
    items.filter((s) => s.status === 'active'),
  );

export const selectActiveSubscriptionsByMenteeId = (menteeId: string) =>
  createSelector(selectSubscriptionsByMenteeId(menteeId), (items) =>
    items.filter((s) => s.status === 'active'),
  );

export const selectSubscriptionById = (id: string) =>
  createSelector(selectAllSubscriptions, (items) => items.find((s) => s.id === id) ?? null);

export const selectConversationsByMentorId = (mentorId: string) =>
  createSelector(selectMessagingState, (s) => s.conversations.filter((c) => c.mentorId === mentorId));

export const selectConversationsByMenteeId = (menteeId: string) =>
  createSelector(selectMessagingState, (s) => s.conversations.filter((c) => c.menteeId === menteeId));

export const selectMessagesByConversationId = (conversationId: string) =>
  createSelector(selectMessagingState, (s) =>
    s.conversations.find((c) => c.id === conversationId)?.messages ?? [],
  );

export const selectUnreadCountsByConversationId = createSelector(
  selectMessagingState,
  (s) => s.mentorUnread,
);

export const selectReportBySubscriptionId = (subscriptionId: string) =>
  createSelector(selectMenteeReports, (reports) =>
    reports.find((r) => (r as { subscriptionId?: string }).subscriptionId === subscriptionId) ?? null,
  );

export const selectReportsByMentorId = (mentorId: string) =>
  createSelector(selectMenteeReports, (reports) => reports.filter((r) => r.mentorId === mentorId));

export const selectReviewStatsByMentorId = (mentorId: string) =>
  createSelector(selectMentorProfileReviews, (reviews) => {
    const mine = reviews.filter((r) => r.mentorId === mentorId);
    const count = mine.length;
    const avg = count ? mine.reduce((s, r) => s + r.rating, 0) / count : 0;
    return { count, averageRating: Number(avg.toFixed(1)) };
  });

export const selectApprovedMentorProfiles = createSelector(
  selectAllUsers,
  selectMentorProfileReviews,
  (users, reviews) => {
    const catalogByUserId = new Map(
      MENTORS.filter((m) => !!m.userId).map((m) => [m.userId!, m] as const),
    );
    const approved = users.filter(
      (u) => u.role === UserRole.Mentor && u.mentorApprovalStatus === 'approved' && u.status !== 'suspended',
    );
    return approved.map((u) => {
      const mine = reviews.filter((r) => r.mentorId === u.id);
      const avg = mine.length ? mine.reduce((s, r) => s + r.rating, 0) / mine.length : 0;
      const primaryPrice = Number(u.mentorPlans?.[0]?.price ?? u.subscriptionCost ?? 0);
      const catalog = catalogByUserId.get(u.id);
      return {
        // Keep stable public route ids for linked catalog mentors.
        id: catalog?.id ?? u.id,
        name: u.name,
        title: u.jobTitle ?? 'Mentor',
        company: u.company ?? 'Mentorchief',
        expertise: u.skills ?? [],
        rating: Number(avg.toFixed(1)),
        reviews: mine.length,
        price: primaryPrice,
        bio: u.bio ?? '',
        image: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`,
        sessions: catalog?.sessions ?? 0,
        responseTime: 'N/A',
        yearsOfExperience: Number(u.yearsOfExperience ?? 0),
        userId: u.id,
        linkedin: u.linkedin,
      };
    });
  },
);

