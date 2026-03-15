# MentorChief — App Structure & Developer Guide

This document explains **how the application is structured** and **how everything works** so a human can continue development. Use it as the main entry point; it references other docs where useful.

---

## 1. What is MentorChief?

MentorChief is a **mentorship platform** (Angular 18 SPA):

- **Visitors** browse mentors, view profiles, sign up or log in.
- **Mentees** request monthly subscriptions with mentors, manage mentorships, leave reviews, and can **cancel within 3 days for a full refund** (mentor is informed).
- **Mentors** accept/decline requests, manage mentees, submit end-of-mentorship reports. New mentors are **pending** until an admin approves.
- **Admins** approve/reject mentor applications, view users, payments, and mentorship reports.

The app uses **monthly subscriptions only** (no one-time sessions). **Subscriptions do not auto-renew** — the user must renew manually before the current period ends. Data is **mock/in-memory** plus `sessionStorage` for auth and some request state; there is no backend server.

---

## 2. Quick Start

```bash
# Install
npm install

# Run (dev server at http://localhost:4200)
npm start

# Build
npm run build

# E2E (requires app running)
npm run test:e2e           # full-scenario
npm run test:e2e:audit     # audit suite (guards, registration, cancel, etc.)
```

**Demo logins:** See [docs/USER-AND-ACTION-FLOWS.md](USER-AND-ACTION-FLOWS.md) — e.g. `mentee@demo.com` / `password123`, `mentor@demo.com` / `password123`, `admin@mentorchief.com` / `admin2026`.

---

## 3. Folder Structure

```
src/app/
├── app.component.ts          # Root: router-outlet, toast, confirm-dialog
├── app.config.ts            # Providers: Store, Effects, Router, APP_INITIALIZER
├── app.routes.ts             # All routes and guards (single file, no lazy load)
│
├── core/                     # Shared across features
│   ├── data/                # Static mock data
│   │   ├── mentors.data.ts  # MENTORS array (browse, profiles)
│   │   └── testimonials.data.ts
│   ├── guards/
│   │   └── auth.guard.ts    # authGuard, guestGuard, registrationGuard, roleGuard, mentorApprovalGuard
│   ├── layout/
│   │   ├── layout.component.ts           # Public: header + footer + router-outlet
│   │   ├── registration-layout.component.ts  # Registration steps: stepper + outlet
│   │   └── dashboard-layout.component.ts    # Dashboard: sidebar + outlet + demo banner
│   ├── models/              # TypeScript interfaces (auth, user, mentor, dashboard, registration)
│   └── services/
│       ├── auth-api.service.ts   # Mock auth API (login, signup, loadCurrentUser, markRegistered, approve/reject mentor)
│       └── app-initializer.service.ts  # Runs on bootstrap: loadCurrentUser → dispatch loadCurrentUserSuccess
│
├── features/                # Feature-based modules
│   ├── auth/                # Login, signup, forgot/reset password, verify email
│   │   ├── smart/           # Page/smart components (login-page, signup-page, …)
│   │   ├── ui/              # Presentational forms (login-form, signup-form, …)
│   │   └── store/           # actions, reducer, selectors, effects
│   ├── registration/       # Post-signup onboarding (role → personal → career → bio → preference → preview)
│   │   ├── smart/           # role-info-page, personal-info-page, … preview-page
│   │   ├── ui/              # role-info-form, etc.
│   │   └── store/           # actions, reducer, selectors, effects
│   ├── public/              # Landing, browse, mentor profile, how-it-works, about, terms, privacy, help
│   │   └── smart/           # landing-page, browse-mentors-page, mentor-profile-page, …
│   └── dashboard/           # Mentee, mentor, admin dashboards
│       ├── mentee-dashboard.component.ts   # Mentee home
│       ├── mentor-dashboard.component.ts   # Mentor home
│       ├── admin-dashboard.component.ts   # Admin home
│       ├── store/           # dashboard.actions, reducer, selectors (no effects)
│       ├── mentee/          # my-mentors, messages, payments, reports, settings
│       ├── mentor/          # my-mentees, report/:menteeId, messages, earnings, reports, settings, pending, rejected
│       └── admin/           # mentor-applications, users, payments, reports, mentorship-reports, settings
│
├── shared/                  # Reusable UI and services
│   ├── components/          # navbar, footer, toast, confirm-dialog, pagination, mentor-card
│   └── services/            # toast.service, confirm-dialog.service
│
└── store/                   # Root NgRx wiring
    ├── app.state.ts         # AppState = { auth, registration, dashboard }
    └── app.reducer.ts       # actionReducerMap combining the three feature reducers
```

**Conventions:**

- **Smart components** (in `smart/` or at feature root): handle routing, store, services, user actions.
- **UI components** (in `ui/`): presentational forms/cards; inputs/outputs, minimal logic.
- **Store per feature:** `actions`, `reducer`, `selectors`; `effects` only in auth and registration.

---

## 4. Routing & Layouts

All routes are defined in **`app.routes.ts`**. There is **no lazy loading**; every route imports its component directly.

### Layouts

| Layout | Paths | Purpose |
|--------|--------|---------|
| **LayoutComponent** | `/`, `/login`, `/signup`, `/browse`, `/mentor/:id`, `/how-it-works`, `/about`, … | Public site: navbar + footer + `<router-outlet>`. |
| **RegistrationLayoutComponent** | `/auth/registration-steps/*` | Stepper (Role → Personal → Career → Bio → Preference → Preview) + outlet. |
| **DashboardLayoutComponent** | `/dashboard/mentee/*`, `/dashboard/mentor/*`, `/dashboard/admin/*` | Sidebar (role-specific links) + outlet + demo banner. |

### Guards (order matters)

| Guard | Used on | Behavior |
|-------|--------|----------|
| **authGuard** | All dashboard and `/mentor/:id/request` | Not logged in → redirect to `/login?returnUrl=...`. |
| **guestGuard** | `/login`, `/signup` | Logged in → redirect to role dashboard (or mentor pending/rejected). |
| **registrationGuard** | `/auth/registration-steps` | No user → `/signup`. Already registered → redirect by role. Else allow. |
| **roleGuard(roles)** | Dashboard segments | Wrong role → redirect to login or correct dashboard. |
| **mentorApprovalGuard** | `/dashboard/mentor` | Pending mentor → only `/pending`; rejected → only `/rejected`; approved → full mentor routes. |

Guard logic lives in **`core/guards/auth.guard.ts`**. They read `Store` (e.g. `selectIsAuthenticated`, `selectAuthUser`) and return `UrlTree` or `true`.

### Route list (concise)

- **Public:** `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, `/browse`, `/mentor/:id`, `/mentor/:id/request` (mentee only), `/how-it-works`, `/about`, `/help`, `/terms`, `/privacy`, `/blog` → about.
- **Registration:** `/auth/registration-steps` → `role-info` | `personal-info` | `career-info` | `biography` | `preference` | `preview`.
- **Mentee:** `/dashboard/mentee`, `my-mentors`, `messages`, `payments`, `reports`, `settings`.
- **Mentor:** `/dashboard/mentor/pending`, `rejected`, `` (home), `my-mentees`, `report/:menteeId`, `messages`, `earnings`, `reports`, `settings`.
- **Admin:** `/dashboard/admin`, `mentor-applications`, `users`, `payments`, `reports`, `mentorship-reports`, `settings`.
- **Catch-all:** `**` → `/`.

Full route table with components and APIs: [TECHNICAL-AUDIT-REPORT.md](TECHNICAL-AUDIT-REPORT.md) §2.

---

## 5. State (NgRx)

### Root state

**`store/app.state.ts`:**

```ts
interface AppState {
  auth: AuthState;
  registration: RegistrationState;
  dashboard: DashboardState;
}
```

**`store/app.reducer.ts`** combines `authReducer`, `registrationReducer`, `dashboardReducer`. **`app.config.ts`** registers `provideStore(appReducers)` and `provideEffects([AuthEffects, RegistrationEffects])` (no dashboard effects).

### Auth (`features/auth/store/`)

- **State:** `user`, `isAuthenticated`, `isRegistered`, `loading`, `error`.
- **Actions:** `login`, `loginSuccess`, `loginFailure`, `signup`, `signupSuccess`, `signupFailure`, `loadCurrentUserSuccess`, `markRegistered`, `logout`, etc.
- **Effects:** Login/signup call `AuthApiService`, then dispatch success/failure; `redirectAfterLogin$` / `redirectAfterSignup$` navigate by role (and mentor status); `getSafeReturnUrl$` for mentee returnUrl.
- **Selectors:** `selectAuthUser`, `selectIsAuthenticated`, `selectIsRegistered`, etc.

Session is stored in **`sessionStorage`** under `mentorchief_user` by `AuthApiService`. On app load, **`AppInitializerService`** calls `authApi.loadCurrentUser()` and dispatches `loadCurrentUserSuccess({ user })` (or `user: null`).

### Registration (`features/registration/store/`)

- **State:** Multi-step form data (role, personal, career, bio, preference, etc.) plus `currentStep`.
- **Actions:** `hydrateFromSession`, `hydrateFromSessionSuccess`, `setRole`, `setPersonalInfo`, etc., and `submitRegistration` (or equivalent) that calls API and `markRegistered`.
- **Effects:** `hydrateFromSession$` reads from sessionStorage and dispatches `hydrateFromSessionSuccess`; submit step may call API.
- **Selectors:** Used by registration pages to read/write step data.

Registration layout dispatches `hydrateFromSession()` on init so the stepper can restore from session.

### Dashboard (`features/dashboard/store/`)

- **State:** `mentee`, `mentor`, `admin` (dashboard slices), **`platformUsers`** (single source for all users – auth login/signup and admin users page use this list), `myMentors`, `myMentees`, `menteeReviews`, `menteeReports`, `adminReports`. All **in-memory**; no HTTP.
- **Actions:** `acceptMentorshipRequest`, `declineMentorshipRequest`, `acceptMenteeRequest`, `addMenteeReport`, `removeMenteeFromList`, `submitMentorReview`, **`cancelMenteeSubscription`**, etc.
- **No effects.** Components or services call the store directly; admin mentor approve/reject uses `AuthApiService` from the component.
- **Selectors:** `selectMenteeSubscription`, `selectCanCancelSubscriptionForRefund`, `selectActiveMentorship`, `selectMyMenteesPending`, `selectMenteeReportsWithMenteeNames`, etc.

**Which store/selectors to use (data sharing):**
- **Auth** (`auth` slice): Use `selectAuthUser`, `selectIsAuthenticated`, `selectIsRegistered`, `selectAuthLoading`, `selectAuthError` for login state and current user. Dispatch `login`, `signup`, `logout`, `updateProfile`, `markRegistered`; `loadCurrentUserSuccess` is used by app initializer.
- **Registration** (`registration` slice): Use `selectRegistrationData`, `selectRegistrationCurrentStep`, `selectRegistrationTotalSteps` in registration layout and step pages. Dispatch `updateData`, `setCurrentStep`, `resetData`, `hydrateFromSession`.
- **Dashboard** (`dashboard` slice): Use **role- and user-scoped** selectors so data is shared correctly:
  - **Mentee:** `selectActiveMentorship`, `selectMenteeSubscription`, `selectMenteePayments`, `selectActiveMentorsList`, `selectPastMentorsWithReviews`, **`selectMenteeReportsForCurrentMentee`** (only this mentee’s reports).
  - **Mentor:** `selectMentorStats`, `selectMentorPendingRequests`, `selectMentorActiveMentees`, `selectMyMenteesPending`, `selectMyMenteesActive`, `selectMyMentees`, **`selectMenteeReportsForCurrentMentor`** (only this mentor’s reports, with mentee names).
  - **Admin:** `selectAdminStats`, `selectAdminPendingActions`, `selectAdminRecentActivities`, `selectReportMetrics`, `selectReportRevenueChart`, etc., and **`selectMenteeReportsWithMenteeNames`** for all reports (no filter by user).

Important: **Mentorship “request” from mentor profile** is stored in **sessionStorage** (`mentorchief_pending_mentorship_requests`), not in NgRx, so mentor’s “pending requests” in the dashboard come from reducer initial state, not from that request. See TECHNICAL-AUDIT-REPORT.md for the known gap.

---

## 6. Data & Services

### AuthApiService (`core/services/auth-api.service.ts`)

**Mock only.** In-memory `mockUsers` array and `sessionStorage` key `mentorchief_user`.

- **login(payload)** → success stores user in sessionStorage, returns `of(user)`; invalid → `throwError`.
- **signup(payload)** → adds user to `mockUsers`, sets sessionStorage, returns user (new mentors get `mentorApprovalStatus: 'pending'`).
- **loadCurrentUser()** → reads sessionStorage, returns user or throws.
- **markRegistered(updates)** → updates user in memory and sessionStorage.
- **logout()** → removes sessionStorage key.
- **getPendingMentors()**, **approveMentor(id)**, **rejectMentor(id)** → used by admin; modify `mockUsers` (and sessionStorage if current user is that mentor).

No HTTP calls. When you add a real backend, replace these with `HttpClient` and keep the same interface where possible.

### Mentor data

- **`core/data/mentors.data.ts`** exports a static **`MENTORS`** array. Used by browse and mentor profile pages. No API.

### Other services

- **ToastService** (`shared/services/toast.service.ts`): show success/error toasts; used by many smart components.
- **ConfirmDialogService** (`shared/services/confirm-dialog.service.ts`): modal confirm/cancel; state is global; **`mc-confirm-dialog`** is rendered in **`app.component.html`** and subscribes to this service.

---

## 7. Key Features (How They Work)

### Login / Signup

1. User submits form → smart component dispatches **login** or **signup**.
2. **AuthEffects** calls `AuthApiService.login()` or `signup()`.
3. On success: **loginSuccess** / **signupSuccess** → reducer sets `user`, `isAuthenticated`; effect **redirectAfterLogin** / **redirectAfterSignup** navigates (mentee → `/dashboard/mentee`, mentor by status, admin → `/dashboard/admin`). Signup then goes to **registration** if not registered.
4. On failure: **loginFailure** / **signupFailure** → reducer sets `error`; form shows it.

### Registration (post-signup)

1. **registrationGuard** allows access only if user exists and is not registered (or redirects by role).
2. User goes through steps; each step updates **registration** state and navigates to next (or preview).
3. **Preview** submits → effect or component calls **markRegistered** and navigates to role dashboard.

### Mentor discovery & request

1. **Browse:** `BrowseMentorsPageComponent` uses **MENTORS** from `mentors.data.ts`; filtering/pagination is local.
2. **Profile:** `MentorProfilePageComponent` resolves mentor by `route.params.id` from **MENTORS**; if not found, shows “Mentor not found”.
3. **Request (mentee):** “Request Mentorship” opens a modal; on send, component stores mentor id in **sessionStorage** (`mentorchief_pending_mentorship_requests`) and shows a toast. Mentor’s “pending” list in **My Mentees** is **not** driven by this (it’s reducer initial state). See TECHNICAL-AUDIT-REPORT.md BUG-1.

### 3-day cancel (mentee)

1. **MenteeSubscription** in dashboard state has optional **startedAt** (YYYY-MM-DD).
2. **selectCanCancelSubscriptionForRefund** is true when subscription is active and `startedAt` is within the last 3 days.
3. Mentee dashboard shows “Cancel subscription (full refund)” only when that selector is true; policy text says “Your mentor will be informed when you cancel.”
4. On confirm, component dispatches **cancelMenteeSubscription**; reducer sets subscription to `cancelled`, clears active mentorship, marks in-escrow payments as **refunded**.
5. Toast: “Subscription cancelled. You will receive a full refund. Your mentor has been informed.” **Notifications are not implemented**; “mentor informed” is product copy until you add a notification/email layer.

### Mentor: accept/decline & report

1. **My Mentees** lists pending/active from **dashboard** state (`myMentees`). Accept → **acceptMenteeRequest**; decline → **declineMentorshipRequest** (or similar).
2. “End mentorship & add report” → navigate to **`/dashboard/mentor/report/:menteeId`** → form submits **addMenteeReport** → reducer appends to `menteeReports` and sets that mentee’s status to completed.

### Admin: mentor applications

1. **AdminMentorApplicationsPageComponent** calls **AuthApiService.getPendingMentors()** and **approveMentor(id)** / **rejectMentor(id)**. No NgRx action for approve/reject; store is not updated until that user reloads (loadCurrentUser).

---

## 8. Bootstrap & App Init

1. **main.ts** boots the app with **app.config.ts**.
2. **APP_INITIALIZER** runs **AppInitializerService.initializeApp()**: calls **AuthApiService.loadCurrentUser()**, then dispatches **loadCurrentUserSuccess({ user })** or **{ user: null }**. So on refresh, auth state is restored from sessionStorage.
3. Router activates; guards run and redirect unauthenticated or wrong-role users as above.

---

## 9. Testing

- **Unit:** Jasmine/Karma; e.g. `auth.reducer.spec.ts`, `auth.selectors.spec.ts`, `dashboard.reducer.spec.ts`.
- **E2E:** Playwright (Node script).
  - **`tests/full-scenario.e2e.js`** — landing, browse, mentee/mentor/admin login and key pages, guard (mentor ≠ mentee), mentor profile request CTA, report form. Run: `npm run test:e2e`.
  - **`tests/audit-e2e-suite.js`** — unauthenticated redirect, invalid login, guest guard, registration (signup → role-info), admin mentor applications, role guard, public routes, mentee My Mentors, 3-day cancel policy on mentee dashboard. Run: `npm run test:e2e:audit`.

App must be running at **http://localhost:4200** for E2E.

---

## 10. Conventions & Tips

- **Standalone components:** All components are standalone; no NgModules.
- **Change detection:** Many components use **OnPush**; async pipe or explicit `markForCheck()` when updating from callbacks.
- **Naming:** Smart components often `*PageComponent` or `*DashboardComponent`; UI components `*FormComponent` or `*CardComponent`. Actions: `[Feature] Action Name`.
- **Adding a new route:** Add it in **app.routes.ts** under the correct layout and guard; import the component (no lazy load currently).
- **Adding a new action (dashboard):** Add action in **dashboard.actions.ts**, handle in **dashboard.reducer.ts**, optionally add selector in **dashboard.selectors.ts**. No effect unless you need an API call (then consider adding an effect or calling a service from the component).
- **Adding auth/registration flow:** Prefer effects for API and redirect; keep reducers synchronous.

---

## 11. Related Docs

| Document | Purpose |
|----------|---------|
| **USER-AND-ACTION-FLOWS.md** | User types, demo logins, guards, flows by role (guest, mentee, mentor, admin). |
| **TECHNICAL-AUDIT-REPORT.md** | Full route map, feature inventory, NgRx flows, API contract, performance, security, bugs, and recommendations. |
| **STORE-VERIFICATION-REPORT.md** | Component-by-component verification that data lives in the store (or static/service) and not in components. |

Use **APP-STRUCTURE-AND-GUIDE.md** (this file) for structure and “how it works”; use **USER-AND-ACTION-FLOWS.md** for “what happens when user X does Y”; use **TECHNICAL-AUDIT-REPORT.md** for deep audit and refactoring ideas.
