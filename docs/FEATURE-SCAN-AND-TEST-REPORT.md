# MentorChief Angular – Feature Scan & Test Report

This document is a **deep, route-by-route and role-by-role** checklist for manual or automated testing. It covers every route, guard, and main user flows.

---

## 1. Roles & Auth

| Role   | Demo login              | Password   | Notes                          |
|--------|-------------------------|------------|--------------------------------|
| Mentee | `mentee@demo.com`       | `password123` | After login → `/dashboard/mentee` |
| Mentor | `mentor@demo.com`       | `password123` | After login → `/dashboard/mentor` |
| Admin  | `admin@mentorchief.com` | `admin2026`   | After login → `/dashboard/admin`  |

- **Auth state**: Restored from `sessionStorage` on app load via `AppInitializerService` → `loadCurrentUserSuccess`.
- **Guards**: `authGuard` (redirect to `/login`), `roleGuard(['mentee'|'mentor'|'admin'])` (redirect to role dashboard), `registrationGuard` (redirect to `/signup` if not authenticated).

---

## 2. Public routes (no auth)

All under layout with navbar + footer. **No login required.**

| Route | Component | What to check |
|-------|------------|----------------|
| `/` | LandingPageComponent | Hero, CTA to Browse / Sign up, links work. |
| `/login` | LoginPageComponent | Form submit dispatches `login`; success → redirect by role (effect); wrong credentials → error message. |
| `/signup` | SignupPageComponent | Form submit dispatches `signup`; existing user → error; new user → redirect to `/auth/registration-steps/role-info` or dashboard if already registered. |
| `/forgot-password` | ForgotPasswordPageComponent | Form and link back to `/login`. |
| `/reset-password` | ResetPasswordPageComponent | Form and link back to `/login`. |
| `/verify-email` | VerifyEmailPageComponent | Message and link to `/login`. |
| `/browse` | BrowseMentorsPageComponent | Mentor cards, filters (search, category, price), pagination, `[routerLink]="['/mentor', mentor.id]"` (id is string). |
| `/mentor/:id` | MentorProfilePageComponent | Resolves mentor from `MENTORS` by `id`; back to browse; pricing; **Request Mentorship** only for role `mentee`; **Sign in to request** when not logged in; **Request pending** when id in sessionStorage. |
| `/mentor/:id/request` | MentorProfilePageComponent (same) | **Guard**: `authGuard` + `roleGuard(['mentee'])`. Mentee only. Opens request modal when route is `mentor/:id/request` (`showRequestModal = true` from route). Submit request → toast, modal close, `hasPendingRequest = true`. |
| `/how-it-works` | HowItWorksPageComponent | Content and CTAs. |
| `/about` | AboutPageComponent | Content and CTAs. |
| `/help` | HelpPageComponent | Content. |
| `/terms` | TermsPageComponent | Content. |
| `/privacy` | PrivacyPageComponent | Content. |
| `/blog` | Redirect | Redirects to `/about`. |

**Scenarios:**

- **Guest** → Login → Mentee: redirect to `/dashboard/mentee`.
- **Guest** → Login → Mentor: redirect to `/dashboard/mentor`.
- **Guest** → Login → Admin: redirect to `/dashboard/admin`.
- **Guest** → Sign up (new email) → redirect to `/auth/registration-steps/role-info`.
- **Mentee** → `/mentor/1` → Request Mentorship → modal → Send Request → pending state.
- **Mentor** → `/mentor/1` → message "Mentors can't subscribe...".
- **Admin** → `/mentor/1` → message "Use the admin dashboard...".
- **Mentor/Admin** → `/mentor/1/request` → redirected to their dashboard (roleGuard).

---

## 3. Registration flow

**Base path**: `auth/registration-steps`. **Guard**: `registrationGuard` (authenticated only; else → `/signup`).

| Route (relative) | Component | What to check |
|------------------|-----------|----------------|
| `` | Redirect | → `role-info`. |
| `role-info` | RoleInfoPageComponent | Choose role (mentee/mentor), continue. |
| `personal-info` | PersonalInfoPageComponent | Form, continue. |
| `career-info` | CareerInfoPageComponent | Form, continue. |
| `biography` | BiographyPageComponent | Form, continue. |
| `preference` | PreferencePageComponent | Mentee only (from role). |
| `preview` | PreviewPageComponent | Review and submit; on submit → `markRegistered` and redirect to role dashboard. |

- Step order and sidebar progress.
- Direct URL to e.g. `preference` without prior steps: depends on registration store hydration (session).

---

## 4. Mentee dashboard (`/dashboard/mentee/*`)

**Guard**: `authGuard` + `roleGuard(['mentee'])`.

| Route | Component | What to check |
|-------|-----------|----------------|
| `` | MenteeDashboardComponent | Active mentorship (from store), subscription, payments; links: View Profile → `/mentor/:mentorId`, Messages, Browse, My Mentors, Payments, Reports. |
| `my-mentors` | MyMentorsPageComponent | **Active**: list from `selectActiveMentorsList`, search, pagination (`activeMentorsFiltered.length`, `onActivePageChange`). **Past**: list from `selectPastMentorsWithReviews`, search, pagination; leave review (modal), submit `submitMentorReview`. Links: View Profile → `/mentor/:id`, Message → `/dashboard/mentee/messages`, View full report → `/dashboard/mentee/reports`. |
| `messages` | MenteeMessagesPageComponent | Mock conversations list, search, pagination (`conversationsFiltered`, `onConvPageChange`). |
| `payments` | MenteePaymentsPageComponent | List from local/data, search, filter, pagination. |
| `reports` | MenteeReportsPageComponent | Store `selectMenteeReports`, search, pagination; link "Prepared by X" → `/mentor/:report.mentorId`. |
| `settings` | MenteeSettingsPageComponent | Settings form / placeholder. |

- **Bug fixed**: `activeMentorsFiltered().length` → `activeMentorsFiltered.length` (getter, not signal).

---

## 5. Mentor dashboard (`/dashboard/mentor/*`)

**Guard**: `authGuard` + `roleGuard(['mentor'])`.

| Route | Component | What to check |
|-------|-----------|----------------|
| `` | MentorDashboardComponent | Stats, pending requests, active mentees; links to Messages, Earnings, Settings. |
| `my-mentees` | MyMenteesPageComponent | **Pending**: `selectMyMenteesPending`, Accept/Decline. **Active**: `selectMyMenteesActive`, search, pagination; Message → messages; "End mentorship & add report" → `/dashboard/mentor/report/:menteeId` (only if `isPeriodExceeded(mentee)`). |
| `report/:menteeId` | MentorReportFormPageComponent | Resolves mentee from `selectMyMentees` by `menteeId`; form (summary, rating, behaviour, strengths, etc.); submit → `addMenteeReport`, toast, navigate to my-mentees. Invalid/unknown menteeId → redirect to my-mentees. |
| `messages` | MentorMessagesPageComponent | Mock conversations, search, pagination. |
| `earnings` | MentorEarningsPageComponent | Table from local data, filter, pagination. |
| `reports` | MentorReportsPageComponent | Store `selectMenteeReportsWithMenteeNames` filtered by `CURRENT_MENTOR_ID` (mock 1), search by mentee/summary, pagination. |
| `settings` | MentorSettingsPageComponent | Settings form / placeholder. |

- Report form: `mentee` and `submitting` are plain properties; OnPush + `cdr.markForCheck()` when mentee is set and on submit.

---

## 6. Admin dashboard (`/dashboard/admin/*`)

**Guard**: `authGuard` + `roleGuard(['admin'])`.

| Route | Component | What to check |
|-------|-----------|----------------|
| `` | AdminDashboardComponent | Stats, pending actions (links use `action.path`), recent activity; quick links to Users, Reports, Payments, Settings. |
| `users` | AdminUsersPageComponent | Local list, search, filter by role, pagination. |
| `payments` | AdminPaymentsPageComponent | Local list, filter, pagination. |
| `reports` | AdminReportsPageComponent | Charts/metrics from store (adminReports). |
| `mentorship-reports` | AdminMentorshipReportsPageComponent | Store `selectMenteeReportsWithMenteeNames`, search (mentor/mentee/summary), pagination; link mentor name → `/mentor/:report.mentorId`. |
| `settings` | AdminSettingsPageComponent | Settings / placeholder. |

- **Build fix**: `ReportWithMenteeName` is now an interface extending `MenteeReport` with `menteeName`; type moved above `@Component` so decorator applies to class.

---

## 7. Layouts & global UI

- **LayoutComponent**: Navbar + footer + `<router-outlet>` for public routes.
- **DashboardLayoutComponent**: Navbar, sidebar (role-based nav from `getNavItems(user.role)`), demo banner, `<router-outlet>`, Sign out (confirm dialog → `logout` → effect navigates to `/login`).
- **Navbar**: Logo → `/`; Find Mentors → `/browse`; How It Works → `/how-it-works`; when authenticated: user dropdown → Dashboard (role dashboard), Profile (role dashboard + `/settings`), Sign out.
- **RegistrationLayoutComponent**: Header with user, step progress, `<router-outlet>`.

---

## 8. Id types and links

- **Public mentor profile**: `MENTORS[].id` is **string** (`'1'`, `'2'`, …). Route `/mentor/:id` and `mentor.id` in `[routerLink]="['/mentor', mentor.id]"` are strings. OK.
- **Mentee dashboard**: `activeMentorship.mentorId` is **string**; `[routerLink]="['/mentor', m.mentorId]"` → `/mentor/1`. OK.
- **My Mentors (mentee)**: `ActiveMentorSummary.id` is **number**; `[routerLink]="['/mentor', mentor.id]"` → Angular coerces to string in URL. OK.
- **Reports**: `MenteeReport.mentorId` is **number**; links `/mentor/2` etc. work. Mentor profile resolves by `id` from route (string); `MENTORS.find(m => m.id === id)` so `id === '2'` matches. OK.

---

## 9. What was fixed in this scan

1. **my-mentors-page.component.ts**: Template used `activeMentorsFiltered().length` (leftover from signals). Changed to `activeMentorsFiltered.length` (getter).
2. **admin/mentorship-reports-page.component.ts**: Type `ReportWithMenteeName` was between `@Component` and class, breaking decorator. Replaced with interface extending `MenteeReport` and moved above `@Component`. Filter uses `r.mentorName`, `r.menteeName`, `r.summary` with proper typing.
3. **mentor/reports-page.component.ts**: Same decorator/type fix; filter uses `r.menteeName` and `r.summary` with proper type (no cast).

---

## 10. Suggested manual test matrix (concise)

| # | Scenario | Steps | Expected |
|---|----------|--------|----------|
| 1 | Guest browse | Open `/browse`, filter, open mentor | Mentor profile, "Sign in to request". |
| 2 | Mentee request | Login mentee, `/mentor/1`, Request → Submit | Pending state, toast. |
| 3 | Mentee dashboard | Login mentee, go dashboard, My Mentors | Active + Past sections, search, pagination, review modal. |
| 4 | Mentor my-mentees | Login mentor, My Mentees, Accept/Decline | Pending count updates; active list. |
| 5 | Mentor report | Mentor, My Mentees, "End mentorship & add report" for a mentee | Report form, submit → my-mentees, report in Reports. |
| 6 | Admin reports | Login admin, Mentorship Reports | List, search, pagination, mentor link to profile. |
| 7 | Role guard | Login mentor, navigate to `/dashboard/mentee` | Redirect to `/dashboard/mentor`. |
| 8 | Logout | Any dashboard, Sign out, confirm | Redirect to `/login`. |
| 9 | Registration | Sign up new user → complete steps → preview submit | Redirect to role dashboard. |

---

## 11. Build status

- **Build**: `npm run build` succeeds.
- **Lint**: No new issues reported for the touched files.
- **Signals**: Removed; components use properties, getters, and `ChangeDetectorRef.markForCheck()` where needed (OnPush).

This report can be used as a single reference for full-scope manual testing and for adding E2E tests per route/role.
