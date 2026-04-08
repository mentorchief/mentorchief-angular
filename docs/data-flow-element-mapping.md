# Data Flow Element Mapping

This checklist defines the canonical NgRx selector source for each operational UI element.
Components should not compute cross-entity joins locally.

## Mentor Dashboard

- Active mentees stat -> `selectActiveSubscriptionsByMentorId` + unique mentee count
- Active mentees list -> `selectActiveSubscriptionsByMentorId` joined with users
- Pending requests -> mentor/request selectors + pending subscriptions
- Earnings tiles -> payments selectors
- Average rating -> review stats selectors (no literals)

## Mentor My Mentees

- Active table rows -> `selectActiveSubscriptionsByMentorId` joined with users
- Status actions -> subscription status + report selectors by `subscriptionId`
- Unread badges -> `selectUnreadCountsByConversationId`

## Mentor Messages

- Conversation sidebar -> `selectConversationsByMentorId`
- Thread messages -> `selectMessagesByConversationId`
- Report CTA visibility -> report selector keyed by selected conversation subscription

## Mentee My Mentors

- Active list -> `selectActiveSubscriptionsByMenteeId` joined with users
- Past list -> `selectSubscriptionsByMenteeId` filtered completed/cancelled + reviews

## Public Pages

- Browse mentors -> approved mentor profile projection selectors (not static catalog)
- Landing featured mentors -> approved mentor profiles selector
- Mentor profile -> user/registration/review/subscription selectors
- Mentor reviews -> review selectors + mentor public profile selector

## Non-compliant Patterns (must not appear)

- Importing `MENTORS` directly in operational components
- Hardcoded operational values (rating, response time, prices, counts)
- Component constructor joins across multiple slices
