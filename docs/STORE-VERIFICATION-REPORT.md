# NgRx Store Verification Report

This document verifies that **all components** use the store for shared/domain data where appropriate. Components are grouped by feature; each entry notes **data source** and **status**.

---

## Summary

| Status | Meaning |
|--------|--------|
| ✅ **Store** | Data comes from NgRx (select/dispatch); no domain data in component. |
| ✅ **Static / core data** | Data from `core/data/*` or static content; not user/dashboard state. |
| ✅ **UI / form only** | Component holds only UI state (filters, pagination, form values). |
| ⚠️ **API only** | Data from service (e.g. AuthApiService) not in store; by design or candidate for store. |
| ⚠️ **Local mock** | Hardcoded list in component; candidate to move to store if shared. |

---

## 1. Auth feature

| Component | Data / state | Source | Status |
|-----------|--------------|--------|--------|
| **login-page** | loading$, error$, user$, isAuthenticated$ | `selectAuthLoading`, `selectAuthError`, `selectAuthUser`, `selectIsAuthenticated` | ✅ Store |
| **signup-page** | loading$, error$, user$, isAuthenticated$ | Same auth selectors; dispatch login/signup | ✅ Store |
| **login-form** | value (email, password) | Form state only | ✅ UI only |
| **signup-form** | value (name, email, password, role) | Form state only | ✅ UI only |
| **forgot-password-page** | — | Form only | ✅ UI only |
| **forgot-password-form** | email | Form state | ✅ UI only |
| **reset-password-page** | password, confirmPassword, requirements | Form state | ✅ UI only |
| **reset-password-form** | password, requirements (@Input) | Form / inputs | ✅ UI only |
| **verify-email-page** | code (6 chars) | Form state for OTP input | ✅ UI only |
| **verify-email-form** | code digits | Form state | ✅ UI only |

---

## 2. Registration feature

| Component | Data / state | Source | Status |
|-----------|--------------|--------|--------|
| **registration-layout** | currentStep$, totalSteps$, data$, user$, isAuthenticated$ | `selectRegistrationCurrentStep`, `selectRegistrationData`, `selectAuthUser`; dispatch hydrateFromSession | ✅ Store |
| **role-info-page** | data$, currentStep$ | `selectRegistrationData`, `selectRegistrationCurrentStep`; dispatch updateData, setCurrentStep | ✅ Store |
| **personal-info-page** | Form + store subscription | selectRegistrationData; dispatch updateData, setCurrentStep | ✅ Store |
| **career-info-page** | Same pattern | selectRegistrationData; dispatch updateData, setCurrentStep | ✅ Store |
| **biography-page** | Same pattern | selectRegistrationData; dispatch updateData, setCurrentStep | ✅ Store |
| **preference-page** | Same pattern | selectRegistrationData; dispatch updateData, setCurrentStep | ✅ Store |
| **preview-page** | data$, user$ | selectRegistrationData, selectAuthUser; dispatch markRegistered, resetData | ✅ Store |
| **role-info-form** | value (role) | Form state | ✅ UI only |

---

## 3. Public feature

| Component | Data / state | Source | Status |
|-----------|--------------|--------|--------|
| **landing-page** | MENTORS, TESTIMONIALS | `core/data/mentors.data`, `core/data/testimonials.data` | ✅ Static |
| **browse-mentors-page** | allMentors = MENTORS, filteredMentors, search/category/price | core/data/mentors.data; filter/pagination in component | ✅ Static + UI |
| **mentor-profile-page** | mentor (from route + MENTORS), user$ | core/data/mentors.data + selectAuthUser | ✅ Static + Store |
| **about-page** | stats, team, values (readonly arrays) | Static content for About page | ✅ Static |
| **how-it-works-page** | — | Static template | ✅ UI only |
| **help-page** | — | Static template | ✅ UI only |
| **terms-page** | — | Static template | ✅ UI only |
| **privacy-page** | policy sections (list content) | Static content | ✅ Static |

---

## 4. Dashboard – layout & home

| Component | Data / state | Source | Status |
|-----------|--------------|--------|--------|
| **dashboard-layout** | user$ | selectAuthUser; dispatch logout | ✅ Store |
| **mentee-dashboard** | user$, activeMentorship$, subscription$, menteePayments$, canCancelForRefund$ | selectAuthUser, selectActiveMentorship, selectMenteeSubscription, selectMenteePayments, selectCanCancelSubscriptionForRefund; dispatch cancelMenteeSubscription | ✅ Store |
| **mentor-dashboard** | user$, mentorStats$, pendingRequests$, activeMentees$, earnings$ | selectAuthUser, selectMentorStats, selectMentorPendingRequests, selectMentorActiveMentees, selectMentorEarnings; dispatch accept/decline | ✅ Store |
| **admin-dashboard** | user$, adminStats$, pendingActions$, recentActivities$ | selectAuthUser, selectAdminStats, selectAdminPendingActions, selectAdminRecentActivities | ✅ Store |

---

## 5. Dashboard – mentee

| Component | Data / state | Source | Status |
|-----------|--------------|--------|--------|
| **my-mentors-page** | activeMentors$, pastMentorsWithReviews$ → activeMentorsList, pastMentorsList | selectActiveMentorsList, selectPastMentorsWithReviews (subscribed in ngOnInit); dispatch submitMentorReview | ✅ Store |
| **messages-page** | conversations, messages, selectedConversation | **Hardcoded in component** (conversations + messages arrays) | ⚠️ Local mock – candidate for store if messages are shared |
| **payments-page** | paymentsList | selectMenteePaymentsForDisplay (subscribed in ngOnInit) | ✅ Store |
| **reports-page** | reportsList | selectMenteeReportsForCurrentMentee (subscribed in ngOnInit) | ✅ Store |
| **settings-page** | user$ | selectAuthUser | ✅ Store |

---

## 6. Dashboard – mentor

| Component | Data / state | Source | Status |
|-----------|--------------|--------|--------|
| **my-mentees-page** | pendingMentees$, activeMentees$ → activeMenteesList | selectMyMenteesPending, selectMyMenteesActive (subscribed in ngOnInit); dispatch acceptMenteeRequest, removeMenteeFromList | ✅ Store |
| **messages-page** | conversations, messages, selectedConversation | **Hardcoded in component** | ⚠️ Local mock – candidate for store if messages are shared |
| **earnings-page** | earningsList, activeMenteesCount | selectMentorEarningsForDisplay, selectMentorActiveMentees (subscribed in ngOnInit) | ✅ Store |
| **reports-page** | reportsList | selectMenteeReportsForCurrentMentor (subscribed in ngOnInit) | ✅ Store |
| **report-form-page** | mentee (from route + selectMyMentees) | selectMyMentees; dispatch addMenteeReport | ✅ Store |
| **settings-page** | user$ | selectAuthUser; dispatch updateProfile | ✅ Store |
| **mentor-application-pending** | user$ | selectAuthUser | ✅ Store |
| **mentor-application-rejected** | — | Static content | ✅ UI only |

---

## 7. Dashboard – admin

| Component | Data / state | Source | Status |
|-----------|--------------|--------|--------|
| **users-page** | usersList | selectAdminUsers (subscribed in ngOnInit); dispatch updateAdminUserStatus | ✅ Store |
| **payments-page** | paymentsList | selectAdminPayments (subscribed in ngOnInit) | ✅ Store |
| **reports-page** | metrics$, revenueChart$, userGrowthChart$, topMentors$, recentActivity$ | selectReportMetrics, selectReportRevenueChart, selectReportUserGrowthChart, selectReportTopMentors, selectReportRecentActivity | ✅ Store |
| **mentorship-reports-page** | reportsList | selectMenteeReportsWithMenteeNames (subscribed in ngOnInit) | ✅ Store |
| **mentor-applications-page** | pendingMentors | **AuthApiService.getPendingMentors()**; approve/reject via AuthApiService | ⚠️ API only – by design (no NgRx for pending mentors in this app) |
| **settings-page** | — | Form state only (platform config, maintenance) | ✅ UI only |

---

## 8. Core layout

| Component | Data / state | Source | Status |
|-----------|--------------|--------|--------|
| **layout** | — | Static shell | ✅ UI only |
| **registration-layout** | See Registration section | Store | ✅ Store |
| **dashboard-layout** | See Dashboard – layout | Store | ✅ Store |

---

## 9. Shared

| Component | Data / state | Source | Status |
|-----------|--------------|--------|--------|
| **navbar** | isAuthenticated$, user$ | selectIsAuthenticated, selectAuthUser; dispatch logout | ✅ Store |
| **footer** | — | Static links | ✅ Static |
| **mentor-card** | mentor (@Input) | Parent passes from MENTORS or list | ✅ Input only |
| **pagination** | totalItems, pageSize, currentPage (@Input); pageChange (@Output) | Stateless UI | ✅ UI only |
| **confirm-dialog** | Service-driven | ConfirmDialogService | ✅ Service |
| **toast** | toasts | ToastService (global UI state) | ✅ Service |

---

## 10. Guards & services

| Item | Data / state | Source | Status |
|------|--------------|--------|--------|
| **auth.guard** | selectIsAuthenticated, selectAuthUser | Store | ✅ Store |
| **auth-api.service** | mockUsers | In-memory + sessionStorage (mock backend) | ✅ Service – not store |
| **app-initializer** | loadCurrentUser → dispatch loadCurrentUserSuccess | Store | ✅ Store |

---

## Recommendations

1. **Mentee & mentor messages-page**  
   Conversations and messages are hardcoded. If messages become shared or persistent, add a `messages` (or `conversations`) slice and load them via selectors; components would then only hold UI state (selected conversation, new message text).

2. **Admin mentor-applications-page**  
   Pending mentors come from `AuthApiService.getPendingMentors()`. Keeping this API-only is consistent with the current design (approve/reject via API, no NgRx action). If you want a single source of truth for “pending mentors” across admin, consider storing them in the dashboard (or auth) state and loading via an effect.

3. **Static content**  
   About (stats, team), privacy, terms, and landing use static data or content. No change needed unless you move copy to CMS/API.

4. **All other dashboard list/data**  
   Admin users, admin payments, mentee payments, mentor earnings, mentee/mentor reports, my-mentors, my-mentees, and dashboard homes use the store correctly; components only hold filter/pagination/form state.

---

*Generated as a one-time verification pass over all components. Re-run or extend this report when adding new features or moving more data into the store.*
