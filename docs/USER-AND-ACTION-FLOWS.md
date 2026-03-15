# MentorChief – User & Action Flows (Review Reference)

This document lists **all user types**, **every main action**, and the **routes and guards** involved so you can review the full flow.

---

## 1. User types and demo logins

| Role   | Purpose                     | Demo login              | Password     | Post-login default                    |
|--------|-----------------------------|-------------------------|-------------|----------------------------------------|
| Guest  | Not logged in               | —                       | —           | —                                      |
| Mentee | Learns from mentors         | `mentee@demo.com`       | `password123` | `/dashboard/mentee`                    |
| Mentor | Teaches mentees             | `mentor@demo.com`       | `password123` | `/dashboard/mentor` (or `/pending` if pending, `/rejected` if rejected) |
| Admin  | Manages platform & mentors | `admin@mentorchief.com` | `admin2026`   | `/dashboard/admin`                     |

**Mentor approval:** New mentors get `mentorApprovalStatus: 'pending'` until an admin approves or rejects. Approved → full dashboard; rejected → “Application not approved” page only. Existing demo mentor is `approved`.

**Subscriptions:** Monthly only; **no auto-renewal** — the user must renew manually before the period ends. Mentee can cancel within 3 days for a full refund (mentor is informed).

---

## 2. Guards (order of execution)

| Guard                | When it runs                    | Behavior |
|----------------------|----------------------------------|----------|
| `authGuard`          | Protected routes                 | Not logged in → redirect to `/login`. |
| `guestGuard`         | `/login`, `/signup`              | Already logged in → redirect to role dashboard (or mentor pending/rejected page). |
| `registrationGuard` | Registration steps               | Not logged in → redirect to `/signup`. |
| `roleGuard(roles)`   | Role-specific routes             | Wrong role or no user → redirect to login or correct dashboard. |
| `mentorApprovalGuard`| Under `/dashboard/mentor`        | Pending mentor → only `/dashboard/mentor/pending`; rejected → only `/dashboard/mentor/rejected`; approved → full dashboard. |

---

## 3. Flows by role

### 3.1 Guest (unauthenticated)

| Action | Where | Route(s) | Result |
|--------|--------|----------|--------|
| View landing | Home | `/` | Landing with CTAs (Browse, Sign up). |
| Browse mentors | Public | `/browse` | List, filters, pagination; links to `/mentor/:id`. |
| View mentor profile | Public | `/mentor/:id` | Profile; CTA = “Sign in to request mentorship”. |
| Try request mentorship | Public | `/mentor/:id/request` | Blocked by `roleGuard(['mentee'])` → redirect to login or dashboard. |
| Log in | Auth | `/login` | If already logged in, `guestGuard` → redirect to dashboard (or mentor pending/rejected). Else submit → effect redirects by role. |
| Sign up | Auth | `/signup` | If already logged in, `guestGuard` → redirect to dashboard. Else new user → redirect to `/auth/registration-steps/role-info` (or dashboard if already registered). |
| Forgot / reset password | Auth | `/forgot-password`, `/reset-password` | Forms and link back to `/login`. |
| Verify email | Auth | `/verify-email` | Message + link to `/login`. |
| How it works / About / Help / Terms / Privacy | Public | `/how-it-works`, `/about`, `/help`, `/terms`, `/privacy` | Static content. |
| Open any dashboard | — | `/dashboard/mentee`, `/dashboard/mentor`, `/dashboard/admin` | `authGuard` → redirect to `/login`. |

---

### 3.2 Mentee

| Action | Where | Route(s) | Result |
|--------|--------|----------|--------|
| After login | — | — | Effect → `/dashboard/mentee`. |
| View dashboard | Mentee | `/dashboard/mentee` | Overview: active mentorship, subscription, payments; links to Browse, My Mentors, Messages, etc. |
| My Mentors | Mentee | `/dashboard/mentee/my-mentors` | Active list (search, pagination); Past list (search, pagination, leave review). |
| Leave review (past mentor) | Mentee | Same page | Modal → submit `submitMentorReview` → store updated. |
| View mentor profile | Public | `/mentor/:id` | Profile; CTA = “Request Mentorship” (or “Request pending” if already requested). |
| Request mentorship | Public | `/mentor/:id` or `/mentor/:id/request` | Modal → Send Request → pending stored in sessionStorage; toast. |
| Messages | Mentee | `/dashboard/mentee/messages` | Mock conversations; search; pagination. |
| Payments | Mentee | `/dashboard/mentee/payments` | List; search; filter; pagination. |
| Reports | Mentee | `/dashboard/mentee/reports` | Reports from store; link to mentor profile. |
| Settings | Mentee | `/dashboard/mentee/settings` | Settings UI. |
| Try mentor or admin area | — | `/dashboard/mentor`, `/dashboard/admin` | `roleGuard` → redirect to `/dashboard/mentee`. |

---

### 3.3 Mentor (approved)

| Action | Where | Route(s) | Result |
|--------|--------|----------|--------|
| After login (approved) | — | — | Effect → `/dashboard/mentor`. |
| View dashboard | Mentor | `/dashboard/mentor` | Stats, pending requests, active mentees; links to Messages, Earnings, Settings. |
| My Mentees | Mentor | `/dashboard/mentor/my-mentees` | Pending: Accept / Decline. Active: list, search, pagination; Message; “End mentorship & add report” → report form. |
| Accept / Decline request | Mentor | Same page | Store: `acceptMenteeRequest` / `declineMentorshipRequest` (or equivalent). |
| End mentorship & add report | Mentor | `/dashboard/mentor/report/:menteeId` | Form; submit → `addMenteeReport`; mentee status → completed; navigate to my-mentees. |
| Messages | Mentor | `/dashboard/mentor/messages` | Mock conversations; search; pagination. |
| Earnings | Mentor | `/dashboard/mentor/earnings` | Table; filter; pagination. |
| Reports | Mentor | `/dashboard/mentor/reports` | Reports (by current mentor); search; pagination. |
| Settings | Mentor | `/dashboard/mentor/settings` | Settings UI. |
| View public mentor profile | Public | `/mentor/:id` | Message: “You’re signed in as a mentor…”. |
| Try mentee or admin area | — | `/dashboard/mentee`, `/dashboard/admin`, `/mentor/:id/request` | `roleGuard` → redirect to mentor dashboard. |

---

### 3.4 Mentor (pending approval)

| Action | Where | Route(s) | Result |
|--------|--------|----------|--------|
| After signup (new mentor) | Registration | Preview → submit | `markRegistered` with `mentorApprovalStatus: 'pending'`; redirect to `/dashboard/mentor/pending`. |
| After login (pending) | — | — | Effect → `/dashboard/mentor/pending`. |
| View “under review” page | Mentor | `/dashboard/mentor/pending` | Message: application under review; admin will approve or reject; “Refresh status”, “Back to home”. |
| Refresh status | Same page | — | Reload; if admin approved, session has `approved` → next load goes to full dashboard. |
| Try any other mentor URL | — | `/dashboard/mentor`, `/dashboard/mentor/my-mentees`, etc. | `mentorApprovalGuard` → redirect to `/dashboard/mentor/pending`. |
| Sidebar | Layout | — | Only “Application status” (→ pending) and “Sign out”. |

---

### 3.5 Mentor (rejected)

| Action | Where | Route(s) | Result |
|--------|--------|----------|--------|
| After login (rejected) | — | — | Effect → `/dashboard/mentor/rejected`. |
| View “not approved” page | Mentor | `/dashboard/mentor/rejected` | Message: application not approved; “Back to home”, “Contact support”. |
| Try any other mentor URL | — | `/dashboard/mentor`, `/dashboard/mentor/my-mentees`, etc. | `mentorApprovalGuard` → redirect to `/dashboard/mentor/rejected`. |
| Sidebar | Layout | — | Only “Application status” (→ rejected) and “Sign out”. |

---

### 3.6 Admin

| Action | Where | Route(s) | Result |
|--------|--------|----------|--------|
| After login | — | — | Effect → `/dashboard/admin`. |
| Dashboard | Admin | `/dashboard/admin` | Stats; pending actions; quick links (Users, Reports, Payments, Settings, Mentor Applications). |
| Mentor applications | Admin | `/dashboard/admin/mentor-applications` | List mentors with `mentorApprovalStatus === 'pending'`. |
| Approve mentor | Admin | Same page | `AuthApiService.approveMentor(id)`; user → `approved`; update session if that user is logged in; toast; remove from list. |
| Reject mentor | Admin | Same page | Confirm → `AuthApiService.rejectMentor(id)`; user → `rejected`; when they next log in they see “Application not approved” page only. |
| Users | Admin | `/dashboard/admin/users` | User list; search; filter by role/status; pagination. |
| Payments | Admin | `/dashboard/admin/payments` | List; filter; pagination. |
| Reports | Admin | `/dashboard/admin/reports` | Charts / metrics. |
| Mentorship reports | Admin | `/dashboard/admin/mentorship-reports` | All mentor reports; search; pagination; link to mentor profile. |
| Settings | Admin | `/dashboard/admin/settings` | Settings UI. |
| View public mentor profile | Public | `/mentor/:id` | Message: “You’re signed in as an admin…”. |
| Try mentee or mentor area | — | `/dashboard/mentee`, `/dashboard/mentor` | `roleGuard` → redirect to `/dashboard/admin`. |

---

## 4. Registration flow (all authenticated users who are not yet registered)

| Step | Route | Component | Action |
|------|--------|-----------|--------|
| 1 | `/auth/registration-steps/role-info` | RoleInfoPageComponent | Choose Mentee or Mentor → Next. |
| 2 | `/auth/registration-steps/personal-info` | PersonalInfoPageComponent | Personal form → Next. |
| 3 | `/auth/registration-steps/career-info` | CareerInfoPageComponent | Career form → Next. |
| 4 | `/auth/registration-steps/biography` | BiographyPageComponent | Bio & skills → Next. |
| 5 (mentor only) | `/auth/registration-steps/preference` | PreferencePageComponent | Mentor preferences → Next. |
| 6 | `/auth/registration-steps/preview` | PreviewPageComponent | Review → “Complete Registration” → `markRegistered(updates)`; mentee → `/browse`; mentor → `/dashboard/mentor/pending`. |

**Guard:** `registrationGuard` (authenticated only; else → `/signup`).

---

## 5. Route summary (with guards)

| Path | Guards | Who can access |
|------|--------|----------------|
| `/`, `/browse`, `/mentor/:id`, `/how-it-works`, `/about`, `/help`, `/terms`, `/privacy`, etc. | None | Everyone. |
| `/login`, `/signup` | guestGuard | Guests only; logged-in users redirect to their dashboard (or mentor pending/rejected). |
| `/mentor/:id/request` | authGuard, roleGuard(['mentee']) | Mentee only. |
| `/auth/registration-steps/*` | registrationGuard | Logged-in only (any role). |
| `/dashboard/mentee/*` | authGuard, roleGuard(['mentee']) | Mentee only. |
| `/dashboard/mentor/pending` | authGuard, roleGuard(['mentor']), mentorApprovalGuard | Mentor with status pending only. |
| `/dashboard/mentor/rejected` | authGuard, roleGuard(['mentor']), mentorApprovalGuard | Mentor with status rejected only. |
| `/dashboard/mentor/*` (other) | authGuard, roleGuard(['mentor']), mentorApprovalGuard | Mentor with status approved only (pending/rejected → redirect to their status page). |
| `/dashboard/admin/*` | authGuard, roleGuard(['admin']) | Admin only. |

---

## 6. Store / API actions (by flow)

| Flow | Action / API | Effect |
|------|----------------|--------|
| Login | `login` → API → `loginSuccess` | User in state; redirect by role (and mentor pending if applicable). |
| Signup | `signup` → API → `signupSuccess` | User in state; redirect to registration or dashboard. |
| Complete registration | `markRegistered(updates)` | User updated (e.g. name, role, `mentorApprovalStatus: 'pending'` for mentors); redirect mentee → browse, mentor → pending. |
| Logout | `logout` | Clear auth state; effect → `/login`. |
| Mentee request mentorship | sessionStorage + UI state | Pending request per mentor id; no store action. |
| Mentee leave review | `submitMentorReview` | `menteeReviews` updated. |
| Mentor accept/decline | `acceptMenteeRequest` / decline action | Pending/active lists updated. |
| Mentor submit report | `addMenteeReport` | New report; mentee status → completed. |
| Admin approve mentor | `AuthApiService.approveMentor(id)` | User.mentorApprovalStatus = approved; session updated if that user is current. |
| Admin reject mentor | `AuthApiService.rejectMentor(id)` | User.mentorApprovalStatus = rejected; on next login mentor sees “Application not approved” page only. |

---

## 7. Quick review checklist

- [ ] Guest can browse, view mentor profile, sign up, log in.
- [ ] Mentee can use full mentee dashboard, request mentorship, leave reviews, view reports.
- [ ] New mentor (signup + registration) lands on “Application under review” and cannot access other mentor routes until approved.
- [ ] Approved mentor can use full mentor dashboard, accept/decline, submit report.
- [ ] Admin sees Mentor Applications, can approve/reject; approved mentor can then use dashboard (after refresh/login).
- [ ] Role guards block cross-role access (e.g. mentor cannot open mentee dashboard).
- [ ] Mentor approval guard restricts pending mentors to `/dashboard/mentor/pending` and rejected to `/dashboard/mentor/rejected` only.
- [ ] Rejected mentor sees “Application not approved” page and cannot access full mentor dashboard.
- [ ] Logged-in users visiting `/login` or `/signup` are redirected by guestGuard to their dashboard (or mentor pending/rejected page).

Use this document to review or test every user type and main action in the app.
