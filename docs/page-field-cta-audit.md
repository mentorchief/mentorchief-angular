# Page, Field, and CTA Audit

This document inventories routed pages, user-visible fields, and CTAs (buttons/links/actions) to support product cleanup decisions on what to keep, remove, merge, or add.

## Scope

- Source of routes: `src/app/app.routes.ts`
- Focus: field-level and button-level UX inventory
- Goal: identify overlap, missing capability, and cleanup opportunities

---

## Public Pages

### `/` Landing

- **Key fields/data shown**
  - Hero copy
  - Featured mentors preview
  - Platform trust/payment protection highlights
- **User actions**
  - Browse mentors
  - Become a mentor
  - Navigate to auth/help/legal pages
- **Notes**
  - Summary/discovery page only; no domain mutations

### `/browse` Browse Mentors

- **Key fields/data shown**
  - Mentor cards: name, title, company, rating, experience, price, availability
  - Filters/search controls
  - Pagination and sorting controls
- **User actions**
  - Filter/search mentor list
  - Open mentor profile
  - Pagination and sorting
- **Notes**
  - Core discovery path for mentees

### `/mentor/:id` Mentor Profile

- **Key fields/data shown**
  - Mentor profile sections: bio, expertise, sample reviews, pricing
  - Request eligibility messaging by role
- **User actions**
  - Go to mentorship request flow (mentee)
  - Navigate to full reviews
  - Back to browse
- **Notes**
  - Request CTA role-gated

### `/mentor/:id/request` Mentor Request (mentee only)

- **Key fields/data shown**
  - Plan selector
  - Optional request message textarea
  - Pending request state message
- **User actions**
  - Send request
  - Cancel pending request
- **Store coupling**
  - `MenteeActions.requestMentorship`
  - `MenteeActions.cancelMentorshipRequest`
- **Notes**
  - Uses NgRx request lifecycle wiring

### `/mentor/:id/reviews` Mentor Reviews

- **Key fields/data shown**
  - Full review list
- **User actions**
  - Read-only page navigation

### Info pages

- `/how-it-works`, `/about`, `/help`, `/terms`, `/privacy`
- **User actions**
  - Read-only navigation/content consumption

---

## Auth Pages

### `/login`

- **Fields**
  - Email, password
- **Actions**
  - Sign in
  - Continue with social buttons
  - Link to signup
- **Store coupling**
  - `AuthActions.login`

### `/signup`

- **Fields**
  - Name, email, password, agreement
- **Actions**
  - Sign up
  - Link to login
- **Store coupling**
  - `AuthActions.signup`

### `/forgot-password`, `/reset-password`, `/verify-email`

- **Fields**
  - Standard auth recovery fields/codes
- **Actions**
  - Submit/continue actions
- **Notes**
  - Behavior can remain placeholder/demo unless backend auth is in scope
- Throttle timer added on resend actions (forgot/verify flows)
---

## Registration Wizard

### `/auth/registration-steps/role-info`

- **Fields**
  - Role selection
- **Actions**
  - Continue
- **Store coupling**
  - `RegistrationActions.updateData`, `setStep`

### `/personal-info`

- **Fields**
  - Name, phone, location, gender, photo
- **Actions**
  - Back/Next
- **Store coupling**
  - `RegistrationActions.updateData`, `setStep`

### `/career-info`

- **Fields**
  - Job title, company, years, experiences
- **Actions**
  - Back/Next

### `/biography`

- **Fields**
  - Bio, skills, tools, portfolio URL
- **Actions**
  - Add/remove skills/tools, Back/Next

### `/preference` (mentor)

- **Fields**
  - Plans/pricing, availability, mentee capacity
- **Actions**
  - Add/remove plans, Back/Next

### `/preview`

- **Fields**
  - Full registration summary readout
- **Actions**
  - Jump back to specific steps
  - Submit/Complete
- **Store coupling**
  - `AuthFacade.markRegistered` (backed by user update action), `RegistrationActions.reset`

---

## Mentee Dashboard

### `/dashboard/mentee`

- **Fields**
  - Active mentorship summary
  - Subscription status
  - Payment status summary
- **Actions**
  - Quick links to mentors/messages/payments/reports
  - Cancel subscription
- **Store coupling**
  - `MenteeActions.cancelSubscription`

### `/dashboard/mentee/my-mentors`

- **Fields**
  - Active mentors list
  - Past mentors list + review/report availability
  - Past mentors list uses pagination
  - Mentor reports moved to My Reports page (separate from review submission cards)
- **Actions**
  - View profile, message mentor
  - Submit mentor review
- **Store coupling**
  - `ReportsActions.submitMentorReview`

### `/dashboard/mentee/messages`

- **Fields**
  - Conversation list, message thread, input
- **Actions**
  - Select conversation
  - Send message
  - Typing indicator shown in thread UI
- **Store coupling**
  - `MessagingActions.selectConversation`, `sendMessage`

### `/dashboard/mentee/payments`

- **Fields**
  - Summary cards: total, in escrow, completed
  - Payment history table fields
  - Search/filter controls

- **Actions**
  - Filter/search, paginate
  - Removed non-functional Add payment method CTA
  - Payment History table uses pagination

### `/dashboard/mentee/reports`

- **Fields**
  - Mentor report list/details
  - Implemented table + pagination + details modal pattern
- **Actions**
  - View report details

### `/dashboard/mentee/settings`

- **Fields**
  - Mentee profile/preferences fields
  - Removed notification/security/danger sections; settings now edits registration-profile fields including photo and saves to store
- **Actions**
  - Save updates

---























## Mentor Dashboard

### `/dashboard/mentor` (summary-only)

- **Fields**
  - Stats cards: active mentees, pending requests, monthly revenue, total earned
  - Pending requests snapshot (name, goal, message, rating)
  - Active mentees snapshot (name, plan, start date)
  - Earnings overview cards
- **Actions**
  - Manage all/Open My Mentees links
  - Quick actions: My Mentees, Messages, Earnings, Settings
- **Notes**
  - Deliberately non-operational to avoid duplication

### `/dashboard/mentor/my-mentees` (operations hub)

- **Fields**
  - Pending requests cards
  - Active mentees table: name/email/plan/start date/unread
  - Capacity stats
- **Actions**
  - Accept/Decline request
  - Message mentee
  - End mentorship/report path
  - Search + pagination
- **Store coupling**
  - `MentorActions.acceptRequest`, `declineRequest`, `acceptMentee`, `removeMentee`

### `/dashboard/mentor/messages`

- **Fields**
  - Search mentees input
  - Conversation list + unread
  - Message composer
- **Actions**
  - Select conversation
  - Clear unread (on select)
  - Send message
- **Store coupling**
  - Messaging action set

### `/dashboard/mentor/report/:menteeId`

- **Fields**
  - Form fields: rating, behaviour, strengths, weaknesses, areas to develop, recommendations
- **Actions**
  - Submit report
- **Store coupling**
  - `ReportsActions.addMenteeReport`
  - `MentorActions.markMenteeCompleted`

### `/dashboard/mentor/report-view/:reportId`

- **Fields**
  - Report details view
- **Actions**
  - View/navigation

### `/dashboard/mentor/reports`

- **Fields**
  - Reports list/summary for mentor
- **Actions**
  - Open report views, filters/search (if present)

### `/dashboard/mentor/earnings`

- **Fields**
  - Monthly earnings rows/cards
  - Status and amount metadata
- **Actions**
  - Navigate to payout/settings as applicable

### `/dashboard/mentor/settings`

- **Fields**
  - Profile: name, email, title, bio
  - Mentorship: monthly rate, capacity, skills chips
  - Payout account: bank/instapay fields in dialog
  - Availability toggle + capacity info
- **Actions**
  - Save profile
  - Add/remove skill
  - Update payout account
  - Toggle accepting new mentees
- **Store coupling**
  - User update action via auth facade
  - `MentorActions.setPayoutAccount`, `setAcceptingNewMentees`

### `/dashboard/mentor/pending` and `/dashboard/mentor/rejected`

- **Fields**
  - Status messaging
- **Actions**
  - Refresh status
  - Back/home navigation

---

## Admin Dashboard

### `/dashboard/admin` (summary)

- **Fields**
  - KPI cards
  - Recent activity
- **Actions**
  - Quick links into admin modules

### `/dashboard/admin/mentor-applications`

- **Fields**
  - Applicant details, skills, profile metadata
- **Actions**
  - Approve/Reject applications
- **Store coupling**
  - `UsersActions.approveMentorRequest` / `rejectMentorRequest` (with effect handling)

### `/dashboard/admin/users`

- **Fields**
  - User table with role/status
  - Search/filter controls
  - Add-user form
- **Actions**
  - Add user
  - Suspend/activate user
- **Store coupling**
  - `UsersActions.addUser`, `setStatus`, `updateUser`

### `/dashboard/admin/messages`

- **Fields**
  - Conversation list/thread fields
- **Actions**
  - Open threads, send/manage message flow

### `/dashboard/admin/payments`

- **Fields**
  - Payments listing and statuses
- **Actions**
  - Filter/search/export-like actions (as present)

### `/dashboard/admin/reports`

- **Fields**
  - Metrics/charts/tables
- **Actions**
  - Filtering/time range controls

### `/dashboard/admin/mentorship-reports`

- **Fields**
  - Mentorship report records
- **Actions**
  - View/detail navigation

### `/dashboard/admin/settings`

- **Fields**
  - Platform controls/toggles
- **Actions**
  - Save platform settings

---

## Overlap and Gaps (for Cleanup)

## High-confidence overlap

- Mentor Dashboard vs My Mentees operations:
  - Keep operations in `my-mentees`, keep dashboard summary-only.

## Known placeholder gaps

- Mentee payments: add payment method is currently non-functional/toast.
- Some auth recovery pages likely demo-level behavior.

## Consistency checks to enforce

- Every editable field must have:
  - clear source of truth
  - explicit save behavior (or explicit autosave)
  - visual feedback on success/failure

---

## Decision Matrix Template

Use this table during refinement:


| Page                           | Field Group      | CTA            | Store Action / Source                        | Keep / Merge / Remove / Add | Priority | Notes          |
| ------------------------------ | ---------------- | -------------- | -------------------------------------------- | --------------------------- | -------- | -------------- |
| `/dashboard/mentor`            | Pending snapshot | Manage all     | route only                                   | Keep                        | P1       | summary only   |
| `/dashboard/mentor/my-mentees` | Pending requests | Accept/Decline | `MentorActions.acceptRequest/declineRequest` | Keep                        | P1       | operations hub |
| ...                            | ...              | ...            | ...                                          | ...                         | ...      | ...            |


