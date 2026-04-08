import type { ChatSubscription } from '../models/chat.model';

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * True when a mentorship subscription period has completed.
 * Uses validUntil when available.
 */
export function isSubscriptionPeriodCompleted(subscription?: ChatSubscription): boolean {
  if (!subscription?.validUntil) return false;
  const validUntilDate = new Date(subscription.validUntil);
  if (Number.isNaN(validUntilDate.getTime())) return false;
  return Date.now() > endOfDay(validUntilDate).getTime();
}

/**
 * Conversation is closed when:
 * - the conversation itself is marked as past, or
 * - subscription is not active, or
 * - validUntil date has passed.
 */
export function isConversationClosed(
  status: 'active' | 'past',
  subscription?: ChatSubscription,
): boolean {
  const subscriptionNotActive = subscription ? subscription.status !== 'active' : false;
  return status !== 'active' || subscriptionNotActive || isSubscriptionPeriodCompleted(subscription);
}
