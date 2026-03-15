# NgRx Store Refactor — Data Flow & Violation Report

## 1. Data Flow Diagram (Entity Ownership)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY OWNERSHIP & REFERENCES                           │
└─────────────────────────────────────────────────────────────────────────────────┘

  auth (session only)
  ├── userId: string | null     ← ONLY session identifier
  └── Full user → selected from users slice via selectAuthUser
       (NO duplication of user data)

  users (EntityAdapter<User>)
  ├── OWNS: All platform users (id, name, email, role, etc.)
  └── Referenced by: auth (selectAuthUser), messaging (join names), admin, reports

  platform
  ├── OWNS: platformConfig (samplePrice, satisfactionRate, etc.)
  └── Referenced by: marketing, reports

  mentor
  ├── OWNS: stats, pendingRequests, activeMentees, earnings, myMentees, payoutAccount
  └── Role-specific; no cross-slice duplication

  mentee
  ├── OWNS: activeMentorship, subscription, payments, myMentors
  └── Role-specific; no cross-slice duplication

  messaging (EntityAdapter<ChatConversationCore>)
  ├── OWNS: conversations (id, mentorId, menteeId, lastMessage, status, messages)
  ├── Does NOT store: mentorName, menteeName
  └── Names joined at selector level from users slice

  reports
  ├── OWNS: menteeReviews, mentorProfileReviews, menteeReports
  └── Referenced by: admin, mentor, mentee dashboards

  admin
  ├── OWNS: stats, pendingActions, recentActivities, reports, payments
  └── Role-specific

  registration
  ├── OWNS: data (role, firstName, bio, etc.), currentStep
  └── Ephemeral; cleared after completion
```

## 2. Selector Flow (Single Source of Truth)

```
selectAuthUser = selectAuthUserId + selectUserEntities
  → Auth stores only userId; full user from users slice

selectAllConversations = selectAllConversationsCore + selectUserEntities
  → Conversations stored without names; mentorName/menteeName joined from users

selectMentorConversations = selectAuthUser + selectAllConversations
  → Filtered by current user (from users)
```

## 3. Violation Report

### Phase 2 — Single Source of Truth (FIXED)

| Violation | Location | Fix Applied |
|-----------|----------|-------------|
| Auth stored full User object | `auth.model.ts`, `auth.reducer.ts` | Auth now stores only `userId`. `selectAuthUser` derives full user from users slice. |
| SessionStorage cached full user | `auth-api.service.ts` | SessionStorage now stores only `userId` (key: `mentorchief_userId`). |
| ChatConversation stored mentorName, menteeName | `chat.model.ts`, `messaging.state.ts` | Introduced `ChatConversationCore` (no names). Names joined in `selectAllConversations` and `selectSelectedConversation` from users slice. |
| Missing users for conversation resolution | `users.reducer.ts` | Added users 7, 8, 9, 10 (Emma Wilson, Michael Brown, David Lee, Sophie Lee) for chat name resolution. |

### Phase 3 — Codebase Audit (FIXED)

| Violation | Location | Fix Applied |
|-----------|----------|-------------|
| Auth actions passed full user | `auth.actions.ts` | `loginSuccess`, `signupSuccess`, `loadCurrentUserSuccess` now pass `userId` only. |
| Auth effects dispatched user | `auth.effects.ts` | Effects map `user.id` to `userId` for auth actions. Redirect effects use `withLatestFrom(selectAuthUser)` for role. |
| Session effects used user from action | `session.effects.ts` | `initializeOnLogin$`, `initializeOnSignup$` use `withLatestFrom(selectAuthUser)` to get role. `initializeOnLoadUser$` uses `selectAuthUser` for role. |
| App initializer dispatched user | `app-initializer.service.ts` | Dispatches `loadCurrentUserSuccess({ userId })` instead of `{ user }`. |
| AuthApiService loadCurrentUser returned User | `auth-api.service.ts` | Returns `Observable<string \| null>` (userId). |
| approveMentor/rejectMentor updated sessionStorage | `auth-api.service.ts` | Removed sessionStorage update for current user; store is source of truth. |
| markRegistered/updateProfile in auth reducer | `auth.reducer.ts` | Removed; updates flow through users slice via `updateUserProfile`. Auth state unchanged. |

### Components — No Violations Found

- All components use `selectAuthUser`, `store.select()`, or `selectSignal()` — no local state duplication.
- No components call services directly for data fetch; they use store selectors.
- No components store subscription results in local variables; they use async pipe or selectSignal.

### Services — No Violations Found

- AuthApiService: No BehaviorSubject/cache; uses store as source of truth. SessionStorage holds only userId.
- No other services maintain duplicate state.

### Effects — No Violations Found

- All mutations go through reducers.
- Effects dispatch to correct feature slices.
- No manual patching outside reducers.

### Selectors — Verified

- All selectors use `createFeatureSelector` + `createSelector`.
- Memoized and granular.
- No selector returns entire feature state.

## 4. Folder Structure (Feature Slices)

```
src/app/
├── store/
│   ├── app.state.ts
│   ├── app.reducer.ts
│   ├── users/           # EntityAdapter<User>
│   │   ├── users.state.ts
│   │   ├── users.actions.ts
│   │   ├── users.reducer.ts
│   │   ├── users.selectors.ts
│   │   └── index.ts
│   ├── platform/
│   ├── mentor/
│   ├── mentee/
│   ├── messaging/       # EntityAdapter<ChatConversationCore>
│   ├── reports/
│   ├── admin/
│   └── session/         # Coordination effects
├── features/
│   ├── auth/
│   │   └── store/
│   │       ├── auth.actions.ts
│   │       ├── auth.reducer.ts
│   │       ├── auth.selectors.ts
│   │       └── auth.effects.ts
│   └── registration/
│       └── store/
└── core/
    └── models/
        ├── auth.model.ts   # AuthState: userId only
        ├── user.model.ts
        └── chat.model.ts   # ChatConversationCore + ChatConversation
```

## 5. Migration Notes

- **Session key change**: `mentorchief_user` → `mentorchief_userId`. Existing sessions will not restore; users must re-login once.
- **ChatConversation**: Components receive `ChatConversation` (with names) from selectors. Stored type is `ChatConversationCore`.
