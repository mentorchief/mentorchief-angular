# Mentorchief Angular — Complete Codebase Audit Report

**Audit Date:** March 14, 2026  
**Auditor:** Senior QA Engineer / Code Auditor  
**Scope:** Full codebase — all modules, flows, and edge cases

---

## PHASE 1 — SYSTEM MAP (Summary)

- **59 components** across auth, registration, dashboard (mentee/mentor/admin), and public features
- **No HTTP client** — AuthApiService is a mock using NgRx store + sessionStorage
- **5 guards:** authGuard, registrationGuard, guestGuard, roleGuard, mentorApprovalGuard
- **2 effects:** AuthEffects, RegistrationEffects
- **3 reducers:** auth, registration, dashboard
- **Entry points:** 40+ routes, forms (login, signup, forgot-password, reset-password, verify-email, add-user, report-form), buttons (approve/reject, save, suspend, cancel, etc.)
- **Exit points:** Store dispatches, sessionStorage (mentorchief_user, mentorchief_signup_temp, mentorchief_mentor_request_pending)

---

## PHASE 2–5 — FINDINGS

---

## CRITICAL (breaks core functionality or is a security risk)

### 1. Mentor profile "See more" condition — wrong operator precedence
- **File:** `src/app/features/public/smart/mentor-profile-page.component.ts` (line 107)
- **What happens:** `@if ((reviewCount$ | async) ?? 0 > sampleReviewsCount)` is parsed as `(reviewCount$ | async) ?? (0 > sampleReviewsCount)`. When `reviewCount$` emits a number (e.g. 2), the result is `2 ?? false` = `2` (truthy). The "See more" link appears even when there are ≤3 reviews.
- **Why it's wrong:** The intent is to show "See more" only when `reviewCount > sampleReviewsCount` (3).
- **Fix:** Use `((reviewCount$ | async) ?? 0) > sampleReviewsCount`.

### 2. Mentor report form — hardcoded mentorId causes reports to never appear for mentor
- **File:** `src/app/features/dashboard/mentor/report-form-page.component.ts` (lines 207–210)
- **What happens:** `addMenteeReport` is dispatched with `mentorId: 1` and `mentorName: 'Mentor'` regardless of the logged-in mentor. `selectMenteeReportsForCurrentMentor` filters by `Number(user.id) === r.mentorId`. For Sarah Chen (user.id = '2'), reports with mentorId 1 never match.
- **Why it's wrong:** Mentors never see their own submitted reports; mentee reports are attributed to the wrong mentor.
- **Fix:** Use the current user's id: inject `Store`, select `selectAuthUser`, and pass `mentorId: Number(user.id)`, `mentorName: user.name` (or equivalent).

### 3. Passwords stored and compared in plain text
- **File:** `src/app/core/services/auth-api.service.ts` (passwords in login, signup, platformUsers)
- **What happens:** `u.password === password` and passwords are stored in plain text in sessionStorage and platformUsers.
- **Why it's wrong:** Critical security risk for any real deployment.
- **Fix:** Use hashed passwords (never store plain text). For a mock, document this is demo-only.

---

## HIGH (wrong behavior, data loss risk, or poor UX with no workaround)

### 4. Mentor settings "Save Changes" does not persist profile data
- **File:** `src/app/features/dashboard/mentor/settings-page.component.ts` (lines 40–53, 227–229)
- **What happens:** Profile inputs use `[value]` (one-way binding). `onSaveProfile()` only shows a toast; no `updateProfile` dispatch. User edits to name, jobTitle, bio, subscriptionCost are never saved.
- **Why it's wrong:** Users believe their profile is saved; data is lost on refresh.
- **Fix:** Use `[(ngModel)]` or a form, capture values, and dispatch `updateProfile({ updates: { name, jobTitle, bio, subscriptionCost } })`.

### 5. Mentee settings "Save Changes" does not persist profile data
- **File:** `src/app/features/dashboard/mentee/settings-page.component.ts` (lines 36–70, 169–171)
- **What happens:** Same pattern as mentor settings — inputs use `[value]`, `onSaveProfile()` only shows a toast; no `updateProfile` dispatch.
- **Fix:** Same as mentor settings.

### 6. Login form — no validation for empty email/password
- **File:** `src/app/features/auth/ui/login-form.component.ts` (lines 127–130)
- **What happens:** Form accepts empty email and password; API returns generic error after submit.
- **Why it's wrong:** Poor UX; unnecessary API calls.
- **Fix:** Add client-side validation (e.g. required, email format) and disable submit when invalid.

### 7. Signup form — password validation not enforced
- **File:** `src/app/features/auth/ui/signup-form.component.ts` (lines 76–78, 186–189)
- **What happens:** UI says "Must be at least 8 characters with 1 uppercase and 1 number" but `isFormValid()` only checks `password.length >= 8`. No uppercase or number check.
- **Why it's wrong:** Weak passwords can be submitted.
- **Fix:** Add regex or explicit checks for uppercase and number in `isFormValid()`.

### 8. Admin approve/reject mentor — success path when user not found
- **File:** `src/app/core/services/auth-api.service.ts` (lines 146–150, 180–184)
- **What happens:** If `user` is not found or not a mentor, `approveMentor`/`rejectMentor` return `of(null)` without error. The admin UI treats `next` as success and removes the user from the list.
- **Why it's wrong:** Admin sees success but the mentor was not updated; inconsistent state.
- **Fix:** Return `throwError` when user not found or not mentor, so the UI can show an error.

---

## MEDIUM (edge case bugs, inconsistencies, missing validations)

### 9. Preview page — empty firstName/lastName can cause undefined display
- **File:** `src/app/features/registration/smart/preview-page.component.ts` (lines 39–40)
- **What happens:** `{{ data.firstName[0] }}{{ data.lastName[0] }}` — if `firstName` or `lastName` is empty, `[0]` is `undefined`.
- **Fix:** Use `(data.firstName || '')[0]` and `(data.lastName || '')[0]` or a helper.

### 10. getSafeReturnUrl — path validation may be too narrow
- **File:** `src/app/features/auth/store/auth.effects.ts` (lines 162–169)
- **What happens:** `returnUrl.startsWith('/mentor/')` rejects paths like `/mentor/1/request` if the check is wrong. Actually it allows `/mentor/1` and `/mentor/1/request` since they start with `/mentor/`. But `returnUrl.includes('..')` could block legitimate paths.
- **Fix:** Consider allowing `/mentor/:id`, `/mentor/:id/reviews`, `/mentor/:id/request` explicitly.

### 11. Admin add user — no duplicate email check before dispatch (race)
- **File:** `src/app/features/dashboard/admin/users-page.component.ts` (lines 319–330)
- **What happens:** `existing` is computed from `usersList` at submit time. If `usersList` is stale (e.g. another tab added), duplicate email could slip through.
- **Fix:** For a mock this is acceptable; for production, add server-side validation.

### 12. WhatsApp URL — empty digits produces invalid URL
- **File:** `src/app/features/dashboard/admin/users-page.component.ts` (lines 299–304)
- **What happens:** `phone.replace(/\D/g, '')` can be empty. `https://wa.me/?text=...` may be invalid.
- **Fix:** If `digits` is empty, hide the WhatsApp link or show a disabled state.

### 13. Mentee reports — mentorId type mismatch (number vs string)
- **File:** `src/app/features/dashboard/mentee/reports-page.component.ts` (line 43)
- **What happens:** `report.mentorId` is number; `routerLink` expects string for `/mentor/:id`. Already fixed with `report.mentorId + ''`.
- **Status:** Resolved; no change needed.

### 14. Double subscription to subscription$ in mentee dashboard
- **File:** `src/app/features/dashboard/mentee-dashboard.component.ts` (lines 83–84, 87–99, 112–125)
- **What happens:** `subscription$ | async` is used twice in the same block. Each creates a separate subscription; minor inefficiency.
- **Fix:** Use `@if (subscription$ | async; as sub)` once and reuse `sub` in the block.

---

## LOW (minor issues, cosmetic inconsistencies, code smells)

### 15. Remove skill button has no handler
- **File:** `src/app/features/dashboard/mentor/settings-page.component.ts` (line 96)
- **What happens:** `<button type="button" class="hover:text-destructive">` has no `(click)` handler.
- **Fix:** Add `(click)="removeSkill(skill)"` and implement `removeSkill`.

### 16. Add skill button has no handler
- **File:** `src/app/features/dashboard/mentor/settings-page.component.ts` (line 102)
- **What happens:** `+ Add Skill` button does nothing.
- **Fix:** Add handler and dispatch `updateProfile` with updated skills.

### 17. toggleAccepting and toggleNotification not persisted
- **File:** `src/app/features/dashboard/mentor/settings-page.component.ts` (lines 211–218)
- **What happens:** `isAccepting` and `notificationSettings` are local state; changes are lost on refresh.
- **Fix:** Persist via `updateProfile` or equivalent store action.

### 18. Users page — typo in template
- **File:** `src/app/features/dashboard/admin/users-page.component.ts` (line 187)
- **What happens:** `getStatusClass(user.status ?? 'active')` — verify there is no accidental `'active')` typo (extra quote/paren).
- **Status:** Re-check; template appears correct.

### 19. Pagination component — no bounds check
- **File:** `src/app/shared/components/pagination.component.ts`
- **What happens:** If `currentPage` is invalid (e.g. 0 or > totalPages), behavior may be undefined.
- **Fix:** Clamp `currentPage` in `goToPage` or in the template.

---

## MISSING FEATURES / LOGICAL GAPS

### 1. Forgot password flow
- **Flow:** No backend; form only shows success message. No actual email or reset link.
- **Recommendation:** Document as mock or add a real flow.

### 2. Reset password flow
- **Flow:** No backend; form only shows success message.
- **Recommendation:** Same as forgot password.

### 3. Verify email flow
- **Flow:** No backend; form only shows success message.
- **Recommendation:** Same as above.

### 4. Mentor request flow
- **Flow:** Request stored in sessionStorage; no backend, no mentor notification. Mentor dashboard shows hardcoded pending requests.
- **Recommendation:** Document as mock or implement backend.

### 5. Rate limiting
- **Flow:** No rate limiting on login, signup, or password reset.
- **Recommendation:** Add for production.

### 6. Form double-submit
- **Flow:** No debounce or disable on submit; user can double-click.
- **Recommendation:** Disable submit button while loading.

### 7. Loading states
- **Flow:** Some flows (e.g. approve/reject mentor) show loading; others (e.g. save profile) do not.
- **Recommendation:** Add loading states for async actions.

### 8. Error handling
- **Flow:** Some flows (e.g. login) show errors; others (e.g. add user) show errors inline. Inconsistent error handling.
- **Recommendation:** Standardize error display and handling.

### 9. Google / LinkedIn buttons
- **Flow:** Buttons have no handlers.
- **Recommendation:** Document as placeholder or implement OAuth.

### 10. Help page categories
- **Flow:** Category buttons have no navigation or behavior.
- **Recommendation:** Add routing or filter.

---

## RECOMMENDATIONS — TOP 3 TO FIX FIRST

### 1. Fix mentor report form mentorId (Critical)
- **Why:** Mentors never see their own reports; mentees see wrong mentor attribution.
- **Effort:** Low — inject `Store`, select `selectAuthUser`, and pass `Number(user.id)` and `user.name`.

### 2. Fix mentor/mentee settings Save (High)
- **Why:** Users expect profile changes to persist; currently nothing is saved.
- **Effort:** Medium — bind inputs with `ngModel`, dispatch `updateProfile` with updated fields.

### 3. Fix mentor profile "See more" condition (Critical)
- **Why:** "See more" link appears even when there are ≤3 reviews.
- **Effort:** Low — add parentheses: `((reviewCount$ | async) ?? 0) > sampleReviewsCount`.

---

## APPENDIX — FLOW VERIFICATION CHECKLIST (Sample)

| Flow | Input validation | Auth | Authz | Error handling | Loading state |
|------|------------------|------|-------|----------------|---------------|
| Login | ❌ | ✅ | N/A | ✅ | ✅ |
| Signup | ⚠️ | N/A | N/A | ✅ | ✅ |
| Mentor request | ❌ | ✅ | ✅ | ✅ | ❌ |
| Approve mentor | ❌ | ✅ | ✅ | ⚠️ | ✅ |
| Save profile (mentor) | N/A | ✅ | ✅ | N/A | ❌ | 
| Submit report | ✅ | ✅ | ✅ | ❌ | ✅ |
| Cancel subscription | N/A | ✅ | ✅ | N/A | ❌ |

---

*End of audit report.*
