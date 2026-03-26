# MentorChief — Full Application Context

> A mentorship marketplace platform connecting mentees with professional mentors, with admin oversight, escrow payments, real-time messaging, and reporting.

---

## 1. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 18.2 (standalone components, `@if`/`@for` control flow, `OnPush` change detection) |
| State Management | NgRx 18 (store, effects, entity, router-store) |
| Backend / Database | Supabase (PostgreSQL + Auth + Realtime + Row Level Security) |
| Styling | Tailwind CSS 3.4 with custom design tokens (`foreground`, `muted`, `primary`, `card`, `border`, `input-background`, etc.) |
| Icons | FontAwesome 7 (`@fortawesome/angular-fontawesome`) |
| Build | Angular CLI 18, TypeScript 5.5 |
| Testing | Karma + Jasmine (configured but not heavily used) |

---

## 2. User Roles

There are exactly **3 roles**, defined in `UserRole` enum:

| Role | Access | Key capabilities |
|---|---|---|
| **Mentee** | `/dashboard/mentee/*` | Browse mentors, request mentorship, pay, receive reports, chat |
| **Mentor** | `/dashboard/mentor/*` | Accept/decline mentees, earn money, write reports, chat |
| **Admin** | `/dashboard/admin/*` | Manage users, approve mentors, release payments, configure platform |

Admin users bypass all role guards — they can access any dashboard.

---

## 3. Database Schema (Supabase PostgreSQL)

### Tables

#### `profiles`
- **Primary key:** `id` (UUID, matches Supabase Auth user ID)
- **Columns:** `name`, `email`, `role` (mentee/mentor/admin), `avatar`, `registered` (boolean), `phone`, `location`, `gender`, `job_title`, `company`, `years_of_experience`, `bio`, `skills` (text[]), `tools` (text[]), `portfolio_url`, `linkedin`, `subscription_cost`, `mentor_plans` (JSONB — array of `{id, duration, price}`), `availability` (text[]), `mentee_capacity`, `mentor_approval_status` (pending/approved/rejected), `status` (active/suspended/pending), `accepting_mentees` (boolean), `payout_account` (JSONB — `{type, bankName?, accountNumber?, instapayNumber?}`), `notification_settings` (JSONB), `join_date`, `experiences` (JSONB — array of `{id, title, company, startDate, endDate, current, description}`), `created_at`, `updated_at`
- **Auto-created** by a DB trigger `on_auth_user_created` when a user signs up via Supabase Auth

#### `mentorships`
- **Primary key:** `id` (UUID)
- **Foreign keys:** `mentor_id` → profiles, `mentee_id` → profiles
- **Columns:** `status` (pending/active/completed/cancelled), `goal`, `message`, `progress` (0-100), `months_active`, `started_at`, `completed_at`, `created_at`, `updated_at`
- **Lifecycle:** pending → active (mentor accepts) → completed (mentor ends & writes report) OR cancelled (either party)

#### `subscriptions`
- **Primary key:** `id` (UUID)
- **Foreign keys:** `mentee_id` → profiles, `mentor_id` → profiles
- **Columns:** `plan_name`, `amount`, `currency` (USD), `status` (active/cancelled/past_due), `next_billing_date`, `started_at`, `created_at`, `updated_at`
- **Created automatically** when a mentorship request is made (via `requestMentorship` API method)
- **Does NOT auto-renew** — mentee must manually renew

#### `payments`
- **Primary key:** `id` (UUID)
- **Foreign keys:** `mentee_id` → profiles, `mentor_id` → profiles
- **Columns:** `amount`, `currency`, `status` (pending_confirmation/in_escrow/released/refunded/disputed), `payment_reference`, `payment_proof_url`, `plan_name`, `month`, `release_date`, `paid_to_mentor` (boolean), `admin_notes`, `created_at`, `updated_at`
- **Flow:** pending_confirmation → in_escrow → released (admin releases) OR refunded/disputed
- **Mentor sees:** earnings page with summary stats + paginated history

#### `conversations`
- **Primary key:** `id` (UUID)
- **Foreign keys:** `mentor_id` → profiles, `mentee_id` → profiles
- **Columns:** `last_message`, `last_timestamp`, `created_at`, `updated_at`
- **Created** when mentor accepts a mentorship request (or manually via getOrCreateConversation)

#### `messages`
- **Primary key:** `id` (UUID)
- **Foreign keys:** `conversation_id` → conversations, `sender_id` → profiles
- **Columns:** `text`, `created_at`
- **sender_id** always derived from authenticated session (never trust client-supplied value)

#### `mentor_unread`
- **Composite key:** `conversation_id` + `mentor_id`
- **Columns:** `unread_count`
- Tracks unread messages for mentor per conversation

#### `mentee_reports`
- **Primary key:** `id` (UUID)
- **Foreign keys:** `mentee_id` → profiles, `mentor_id` → profiles
- **Columns:** `mentor_name`, `summary`, `rating` (1-5), `behaviour`, `strengths` (text[]), `weaknesses` (text[]), `areas_to_develop` (text[]), `recommendations`, `created_at`
- **Written by mentor** at end of mentorship period — shared with mentee and visible to future mentors

#### `mentor_reviews`
- **Primary key:** `id` (UUID)
- **Unique constraint:** `(mentor_id, mentee_id)` — one review per mentee per mentor
- **Foreign keys:** `mentor_id` → profiles, `mentee_id` → profiles
- **Columns:** `rating` (1-5), `comment`, `submitted_at`
- **Written by mentee** after mentorship completes — displayed on public mentor profile

#### `notifications`
- **Primary key:** `id` (UUID)
- **Foreign key:** `user_id` → profiles
- **Columns:** `type` (report_required/report_submitted/payment_released/new_message/mentorship_request/payment_updated/account_updated), `title`, `body`, `read` (boolean), `metadata` (JSONB), `created_at`
- **Created by DB triggers** (not application code) — 7 triggers cover:
  1. New mentorship request → notify mentor (`mentorship_request`)
  2. Mentorship accepted → notify mentee
  3. Mentorship declined → notify mentee
  4. New message → notify other participant (`new_message`)
  5. Report submitted → notify mentee (`report_submitted`)
  6. Payment status change → notify mentor/mentee (`payment_released`, `payment_updated`)
  7. Account status change → notify user (`account_updated`)

#### `platform_config`
- **Single row** (id=1)
- **Columns:** `platform_fee_percent`, `escrow_days`, `min_subscription_price`, `max_subscription_price`, `maintenance_mode`, `updated_at`
- Managed by admin via settings page

---

## 4. Authentication Flow

### Signup
1. User visits `/signup` → chooses Mentee or Mentor role, enters name/email/password
2. `AuthApiService.signup()` → calls `supabase.auth.signUp()` with user metadata
3. DB trigger `on_auth_user_created` auto-creates a `profiles` row with `registered: false`
4. If role is Mentor → sets `mentor_approval_status: 'pending'`
5. User is redirected to registration steps (via `registrationGuard`)

### Registration Steps (multi-step wizard)
1. **Role Info** — confirms role (mentee/mentor)
2. **Personal Info** — name, phone, location, gender
3. **Career Info** — job title, company, years of experience, work history (experiences array)
4. **Biography** — bio text, skills tags, tools tags, portfolio URL
5. **Preferences** (mentor only) — pricing plans, availability, mentee capacity
6. **Preview** — review all data, submit
7. On submit → `AuthApiService.markRegistered()` persists all data and sets `registered: true`

### Login
1. `supabase.auth.signInWithPassword()`
2. Fetch profile from `profiles` table
3. Dispatch `loginSuccess` → triggers `SessionEffects.initializeOnLogin$`
4. Session effects load all role-specific data (mentorships, conversations, reports, notifications, payments)

### Guards
| Guard | Purpose |
|---|---|
| `authGuard` | Requires login, checks suspension, enforces registration |
| `guestGuard` | Blocks logged-in users from login/signup pages |
| `registrationGuard` | Only allows unregistered users to registration steps |
| `roleGuard([roles])` | Checks user role matches (admins bypass) |
| `mentorApprovalGuard([statuses])` | Checks mentor approval status |
| `mentorStatusRootGuard` | Redirects mentor `/dashboard/mentor` to correct status page |
| `menteeReportsGuard` | Validates mentor-mentee relationship for viewing reports |

---

## 5. NgRx State Architecture

### Store Slices

```
AppState
├── auth          → { userId, activeRole, loading, error }
├── registration  → { data, currentStep, totalSteps }
├── users         → { users: User[] }  (EntityAdapter)
├── platform      → { config: PlatformConfig }
├── mentor        → { stats, pendingRequests, activeMentees, earnings, myMentees, payoutAccount, acceptingNewMentees, notificationSettings }
├── mentee        → { activeMentorship, subscription, payments, myMentors }
├── messaging     → { conversations (EntityAdapter), selectedConversationId, mentorUnreadByConversation }
├── reports       → { menteeReviews, menteeReports, mentorProfileReviews }
├── admin         → { stats, pendingActions, recentActivities, reports, payments }
└── notifications → { items: AppNotification[], loaded }
```

### Key Design Decisions
- **Auth slice stores ONLY `userId`** — full User object is resolved via selector from `users` slice
- **No duplication** — user data lives in `users` slice, referenced everywhere by ID
- **Admin has ephemeral `activeRole`** — allows admin to view dashboards as mentor/mentee
- **Conversations store core data only** — names are joined at selector level from users slice
- **Session effects** orchestrate all data loading on login/signup/page reload

### Session Effects Data Loading Flow
On `initializeForRole`:
1. Start Supabase Realtime subscriptions
2. Fetch conversations → dispatch `loadConversations`
3. Fetch mentorships → used to build pending requests, active mentees, my mentors
4. Fetch reports (admin: all, others: own) → dispatch `loadReports`
5. Fetch notifications → dispatch `loadNotifications`
6. **If Mentor:** Fetch payments → map to earnings → dispatch `loadMentorData`
7. **If Mentee:** Build active mentorship + past mentors from mentorships → dispatch `loadMenteeData`
8. **If Admin:** Also fetch all payments + platform config → dispatch `loadAdminData`, `loadAdminPayments`, `loadPlatformConfig`

---

## 6. Supabase Realtime

`RealtimeService` manages 3 types of subscriptions:

### Messages Channel (`messages:{userId}`)
- Listens to `INSERT` on `messages` table
- Ignores own messages (already added optimistically)
- Dispatches `sendChatMessage` for received messages

### Notifications Channel (`notifications:{userId}`)
- Listens to `INSERT` on `notifications` table filtered by `user_id`
- Dispatches `addNotification` to prepend to notifications list

### Mentorships Channel (`mentorships:{userId}`) — Mentor only
- Listens to `*` (all events) on `mentorships` table filtered by `mentor_id`
- On any change → refetches all mentorships and updates store
- Keeps pending requests and mentee list reactive

### Typing Indicators (Broadcast)
- Per-conversation broadcast channel (`typing:{conversationId}`)
- Broadcasts `{ userId, isTyping }` events
- 2.5s timeout auto-clears typing indicator
- Subscribe/unsubscribe on conversation select/deselect

---

## 7. Features by Role

### 7.1 Public Pages (No auth required)

#### Landing Page (`/`)
- Hero section with platform stats (total users, mentors, mentees)
- Featured mentors grid (from approved mentors in store)
- "How It Works" section (3-step process)
- Testimonials carousel
- Escrow payment trust section
- CTA to browse mentors or sign up

#### Browse Mentors (`/browse`)
- Grid of mentor cards with search (by name, title, company)
- Filter by expertise/skills
- Pagination
- Each card links to `/mentor/:id`

#### Mentor Profile (`/mentor/:id`)
- Full profile with bio, skills, tools, experience, rating
- **Pricing plans sidebar** — shows all mentor plans (monthly/quarterly/6months) with prices
- **Request Mentorship modal** (mentee only, auth required):
  - Select plan from dropdown
  - Enter goal and message
  - Submit → creates mentorship (pending) + subscription (active)
- Reviews section with average rating
- Link to full reviews page

#### Mentor Reviews (`/mentor/:id/reviews`)
- Full list of all reviews for a mentor
- Rating distribution bar chart
- Sorted by date

### 7.2 Mentee Dashboard

#### Dashboard Home (`/dashboard/mentee`)
- Active mentorship card (mentor name, title, progress, months active)
- Subscription status (plan, amount, valid until)
- Quick actions: My Mentors, Messages, Payments, Settings

#### My Mentors (`/dashboard/mentee/my-mentors`)
- **Active mentors**: card with mentor info, plan, message button
- **Past mentors**: cards with option to write review (modal with 1-5 star rating + comment)
- Cancellation: within 3 days of subscription start → full refund option

#### Messages (`/dashboard/mentee/messages`)
- Conversation list (left panel) with unread badges
- Real-time chat (right panel) with typing indicators
- Search conversations by mentor name (BE-driven)
- Pagination on conversation list

#### Payments (`/dashboard/mentee/payments`)
- Payment history table (date, mentor, amount, status)
- Status types: `in_escrow`, `completed` (released), `refunded`
- Payment method display

#### Reports (`/dashboard/mentee/reports`)
- Reports written by mentors about this mentee
- Full report view with summary, rating, behaviour, strengths, weaknesses, areas to develop, recommendations

#### Settings (`/dashboard/mentee/settings`)
- Personal info (name, email, phone, location, gender)
- Background (job title, company, years of experience)
- Skills & tools tags
- Bio editing
- Account management

### 7.3 Mentor Dashboard

#### Application Status Pages
- **Pending** (`/dashboard/mentor/pending`): shown while admin reviews application
- **Rejected** (`/dashboard/mentor/rejected`): shown if application rejected, with support contact

#### Dashboard Home (`/dashboard/mentor/home`)
- Stats grid: Active Mentees, Monthly Revenue, Total Earned, Avg. Rating
- Pending requests with Accept/Decline buttons (calls BE API)
- Quick actions sidebar: My Mentees, Messages, Earnings, Settings

#### My Mentees (`/dashboard/mentor/my-mentees`)
- **Pending Requests section** (store-driven, small dataset)
  - Accept → calls `acceptMentorship` API, creates conversation, adds to mentee list
  - Decline → calls `declineMentorship` API with confirmation dialog
- **Active Mentees table** (BE-driven search/filter/pagination)
  - Search by name/email (300ms debounce, hits Supabase)
  - Columns: Mentee (avatar + name + email), Plan, Start Date, Actions
  - Actions: Message, End mentorship & add report (shown when plan period exceeded)
  - Pagination via `.range()` on Supabase query

#### Messages (`/dashboard/mentor/messages`)
- Same layout as mentee messages
- Conversation search hits BE (`searchConversations` → returns matching conversation IDs)
- Typing indicators via Supabase Broadcast
- 300ms debounced search

#### Earnings (`/dashboard/mentor/earnings`)
- **Summary cards**: Total Earned, In Escrow, This Month, Active Mentees
  - Summary stats fetched separately (all payments, no filter)
- **Earnings History table** (BE-driven)
  - Search by mentee name, period (300ms debounce)
  - Filter by status (Paid/In Escrow/Pending)
  - Pagination via `.range()` on Supabase query
- **Payout Account section**
  - Two types: Bank Account or Instapay
  - Bank: name (min 2 chars), account number (10-20 digits only)
  - Instapay: number starting with 01, exactly 11 digits
  - Update persists to Supabase via `updateMentorPayoutAccount`

#### Reports (`/dashboard/mentor/reports`)
- **Data table** (BE-driven search/filter/pagination)
  - Search by mentee name or summary (300ms debounce)
  - Filter by minimum rating (3+, 4+, 5 stars)
  - Columns: Mentee (link to mentee-reports page), Date Submitted, Rating (stars), Summary (truncated), Details button
  - Pagination via `.range()` on Supabase query
- **Detail Modal**: Full report view with all sections

#### Mentee Reports (`/dashboard/mentor/mentee-reports/:menteeUuid`)
- All reports for a specific mentee from all mentors
- Protected by `menteeReportsGuard` (must have mentorship relationship)

#### Report Form (`/dashboard/mentor/report/:menteeId`)
- End-of-mentorship report submission
- Fields: summary, overall rating (1-5), behaviour, strengths (dynamic list), weaknesses (dynamic list), areas to develop (dynamic list), recommendations
- Submits via `insertMenteeReport` API

#### My Reviews (`/dashboard/mentor/reviews`)
- Reviews received from mentees
- Rating distribution chart
- Search reviews

#### Settings (`/dashboard/mentor/settings`)
- **Personal Info**: name, email, phone, location, gender
- **Career / Work History**:
  - Current position fields (job title, company, years of experience)
  - Full experiences editor: add/remove entries with title, company, start/end dates, "current" toggle, description
- **Bio & Skills**: bio text, skills tags, tools tags, portfolio URL, LinkedIn
- **Mentorship Preferences**: pricing plans (monthly/quarterly/6months), mentee capacity, accepting mentees toggle

### 7.4 Admin Dashboard

#### Dashboard Home (`/dashboard/admin`)
- Stats grid: Total Users, Active Mentors, Active Mentees, Monthly Revenue, Active Sessions, Platform Growth
- Pending actions with counts (mentor applications, reported issues)
- Recent activity feed

#### Users (`/dashboard/admin/users`)
- User table with search/filter by role and status
- Actions: approve/reject mentors, suspend/activate users
- WhatsApp integration link per user (phone number)

#### Mentor Applications (`/dashboard/admin/mentor-applications`)
- List of pending mentor registrations
- Detail view with all registration data
- Approve or Reject buttons → updates `mentor_approval_status`

#### Payments (`/dashboard/admin/payments`)
- All payments table with search/filter by status
- Actions: Release payment (changes status to `released`), manage disputes
- Shows mentee name, mentor name, amount, status

#### Mentorship Reports (`/dashboard/admin/mentorship-reports`)
- All mentee reports submitted by mentors
- Review reports, option to release associated payment

#### Messages (`/dashboard/admin/messages`)
- Read-only view of all conversations
- Monitor mentor-mentee communications

#### Platform Reports (`/dashboard/admin/reports`)
- Analytics dashboard: revenue metrics, user growth charts, top mentors, activity feed

#### Settings (`/dashboard/admin/settings`)
- Platform fee percentage
- Escrow period (days)
- Min/max subscription price
- Maintenance mode toggle
- All settings persisted to `platform_config` table

---

## 8. Payment & Escrow Flow

```
1. Mentee requests mentorship → selects plan → subscription created
2. Payment record created (status: pending_confirmation or in_escrow)
3. Money held in escrow during mentorship period
4. Mentee can cancel within 3 days for full refund
5. After mentorship period:
   a. Mentor writes end-of-mentorship report
   b. Admin reviews and releases payment (status: released)
   c. Mentor sees earnings in dashboard
6. Disputed payments: admin can set status to 'disputed' or 'refunded'
```

**Payout Methods:**
- Bank Account: requires bank name + account number (10-20 digits)
- Instapay: requires number starting with 01 (11 digits total)

---

## 9. Mentorship Lifecycle

```
1. BROWSING: Mentee browses approved mentors on /browse
2. REQUESTING: Mentee visits mentor profile, selects plan, enters goal/message, submits request
   → Creates mentorship (status: pending) + subscription (status: active)
   → DB trigger sends notification to mentor
3. PENDING: Mentor sees request on dashboard/my-mentees
4. ACCEPTED: Mentor clicks Accept
   → mentorship status → active, started_at set
   → Conversation auto-created for messaging
   → DB trigger sends notification to mentee
5. ACTIVE: Mentor and mentee can chat, progress is tracked
   → Monthly/quarterly/6-month plan determines period
6. PERIOD END: "End mentorship & add report" button appears when plan period exceeded
7. REPORT: Mentor fills out detailed report (rating, summary, strengths, weaknesses, etc.)
   → Report visible to mentee and future mentors
   → DB trigger sends notification to mentee
8. COMPLETED: mentorship status → completed
9. REVIEW: Mentee can write a review of the mentor (1-5 stars + comment)
   → Review visible on public mentor profile

ALTERNATIVE FLOWS:
- DECLINED: Mentor declines request → mentorship status → cancelled, mentee notified
- CANCELLED: Mentee cancels subscription (within 3 days → full refund)
```

---

## 10. Notification System

### Trigger-Based (DB-level, automatic)
All notifications are created by **PostgreSQL triggers** — no application code needed:

| Event | Recipient | Notification Type |
|---|---|---|
| New mentorship request | Mentor | `mentorship_request` |
| Mentorship accepted | Mentee | (trigger) |
| Mentorship declined | Mentee | (trigger) |
| New message | Other participant | `new_message` |
| Report submitted | Mentee | `report_submitted` |
| Payment status change | Mentor | `payment_released` / `payment_updated` |
| Payment status change | Mentee | `payment_updated` |
| Account status change | User | `account_updated` |

### Delivery
- **Push (real-time):** Supabase Realtime subscription on `notifications` table → instantly appears in navbar bell and notifications page
- **In-app:** Navbar bell icon shows unread count badge, dropdown shows latest 6
- **Mark read:** Click notification to mark as read, or "Mark all as read" button

### Notification Page (`/dashboard/*/notifications`)
- Shared across all roles
- Lists all notifications with type-specific icons and colors
- Relative timestamps (Just now, 5m ago, 2h ago, or date)

---

## 11. Messaging System

### Architecture
- Each conversation has exactly one mentor and one mentee
- Messages stored in `messages` table, conversations in `conversations` table
- Names resolved from profile joins (not stored on conversation)

### Real-time Features
1. **Message delivery:** Supabase Realtime `postgres_changes` on `messages` table
2. **Typing indicators:** Supabase Broadcast channel per conversation
3. **Optimistic updates:** Sent messages added to store immediately, then confirmed by API
4. **Unread tracking:** `mentor_unread` table + store tracking per conversation

### UI (both mentor and mentee)
- Left panel: conversation list with search, pagination, unread badges
- Right panel: chat area with message bubbles, typing indicator, input field
- **Search is BE-driven:** calls `searchConversations` API which queries with profile joins
- Auto-scroll to bottom on new message

---

## 12. API Service Methods (`AuthApiService`)

### Authentication
| Method | Description |
|---|---|
| `login(payload)` | Email/password sign in + fetch profile |
| `signup(payload)` | Create auth user + auto-create profile |
| `logout()` | Sign out |
| `loadCurrentUser()` | Get current session user ID |

### Profiles
| Method | Description |
|---|---|
| `getProfileById(userId)` | Single profile by ID |
| `getAllProfiles()` | All profiles (admin) |
| `getApprovedMentors()` | Approved + registered + non-suspended mentors |
| `getPendingMentors()` | Pending approval mentors |
| `updateProfile(updates)` | Update current user profile |
| `markRegistered(updates?)` | Set registered=true with optional data |

### Mentorships
| Method | Description |
|---|---|
| `requestMentorship(...)` | Create mentorship + subscription |
| `getMentorships(userId)` | All mentorships for user (with profile joins) |
| `acceptMentorship(id)` | Set status=active (mentor only) |
| `declineMentorship(id)` | Set status=cancelled (mentor only) |
| `cancelMentorship(id)` | Set status=cancelled (mentee only) |

### Messaging
| Method | Description |
|---|---|
| `getOrCreateConversation(mentorId, menteeId)` | Find or create conversation |
| `getConversations(userId)` | All conversations with messages and profile joins |
| `sendMessage(conversationId, senderId, text)` | Insert message (uses auth session, not senderId param) |

### Reports & Reviews
| Method | Description |
|---|---|
| `insertMenteeReport(data)` | Mentor writes report about mentee |
| `getMenteeReports(userId)` | Reports for a user (as mentor or mentee) |
| `getReportsForMentee(menteeId)` | All reports about a specific mentee |
| `getAllMenteeReports()` | All reports (admin) |
| `submitMentorReview(...)` | Mentee reviews mentor (upsert) |
| `getMentorReviews(mentorId)` | Reviews for a mentor |

### Payments
| Method | Description |
|---|---|
| `getMentorPayments(mentorId)` | All payments for mentor (with mentee profile join) |
| `getAllPayments()` | All payments (admin, with both profile joins) |
| `releasePayment(paymentId)` | Set status=released, paid_to_mentor=true |

### BE Search/Filter/Pagination
| Method | Description |
|---|---|
| `searchMentorReports(mentorId, {query, ratingMin, ratingMax, page, pageSize})` | Search reports with Supabase .ilike(), .gte(), .range() |
| `searchMentorMentees(mentorId, {query, status, page, pageSize})` | Search mentorships with profile join + filter |
| `searchConversations(userId, query)` | Search conversations by participant name |
| `searchMentorPayments(mentorId, {query, status, page, pageSize})` | Search payments with filter + pagination |

### Platform
| Method | Description |
|---|---|
| `getPlatformConfig()` | Fetch platform_config row |
| `savePlatformConfig(config)` | Upsert platform_config |

### Admin
| Method | Description |
|---|---|
| `approveMentor(userId)` | Set mentor_approval_status=approved |
| `rejectMentor(userId)` | Set mentor_approval_status=rejected |
| `updateUserStatus(userId, status)` | Set active/suspended |

### Notifications
| Method | Description |
|---|---|
| `getNotifications(userId)` | Latest 50 notifications |
| `createNotification(data)` | Insert notification |
| `markNotificationRead(id)` | Set read=true |
| `markAllNotificationsRead(userId)` | Set all unread to read |

---

## 13. Route Map

### Public Routes (LayoutComponent)
```
/                          → Landing page
/login                     → Login (guestGuard)
/signup                    → Signup (guestGuard)
/forgot-password           → Forgot password
/reset-password            → Reset password
/verify-email              → Email verification
/suspended                 → Account suspended page
/browse                    → Browse mentors
/mentor/:id                → Mentor profile
/mentor/:id/request        → Mentor profile + request modal (authGuard + roleGuard[Mentee])
/mentor/:id/reviews        → Mentor reviews
/how-it-works              → How it works
/about                     → About
/help                      → Help center
/terms                     → Terms of service
/privacy                   → Privacy policy
```

### Registration (RegistrationLayoutComponent, registrationGuard)
```
/auth/registration-steps/role-info       → Step 1: Choose role
/auth/registration-steps/personal-info   → Step 2: Personal details
/auth/registration-steps/career-info     → Step 3: Career & experience
/auth/registration-steps/biography       → Step 4: Bio & skills
/auth/registration-steps/preference      → Step 5: Mentorship preferences (mentor only)
/auth/registration-steps/preview         → Step 6: Review & submit
```

### Mentee Dashboard (DashboardLayoutComponent, authGuard + roleGuard[Mentee])
```
/dashboard/mentee                → Dashboard home
/dashboard/mentee/my-mentors     → Active & past mentors
/dashboard/mentee/messages       → Chat with mentors
/dashboard/mentee/payments       → Payment history
/dashboard/mentee/reports        → Reports from mentors
/dashboard/mentee/settings       → Profile settings
/dashboard/mentee/notifications  → Notifications
```

### Mentor Dashboard (DashboardLayoutComponent, authGuard + roleGuard[Mentor])
```
/dashboard/mentor                        → Redirects to correct status page
/dashboard/mentor/pending                → Application pending (mentorApprovalGuard[Pending,Rejected])
/dashboard/mentor/rejected               → Application rejected (mentorApprovalGuard[Pending,Rejected])
/dashboard/mentor/home                   → Dashboard home (mentorApprovalGuard[Approved])
/dashboard/mentor/my-mentees             → Manage mentees (mentorApprovalGuard[Approved])
/dashboard/mentor/report/:menteeId       → Write report (mentorApprovalGuard[Approved])
/dashboard/mentor/report-view/:reportId  → View report (mentorApprovalGuard[Approved])
/dashboard/mentor/messages               → Chat with mentees (mentorApprovalGuard[Approved])
/dashboard/mentor/earnings               → Earnings & payout (mentorApprovalGuard[Approved])
/dashboard/mentor/reports                → Submitted reports (mentorApprovalGuard[Approved])
/dashboard/mentor/mentee-reports/:uuid   → Reports for specific mentee (mentorApprovalGuard[Approved] + menteeReportsGuard)
/dashboard/mentor/reviews                → Reviews received (mentorApprovalGuard[Approved])
/dashboard/mentor/settings               → Profile settings (mentorApprovalGuard[Approved])
/dashboard/mentor/notifications          → Notifications (mentorApprovalGuard[Approved])
```

### Admin Dashboard (DashboardLayoutComponent, authGuard + roleGuard[Admin])
```
/dashboard/admin                     → Dashboard home
/dashboard/admin/mentor-applications → Pending mentor approvals
/dashboard/admin/messages            → All conversations (read-only)
/dashboard/admin/users               → User management
/dashboard/admin/payments            → Payment management
/dashboard/admin/reports             → Platform analytics
/dashboard/admin/mentorship-reports  → All mentorship reports
/dashboard/admin/settings            → Platform configuration
/dashboard/admin/notifications       → Notifications
```

---

## 14. Shared UI Components

| Component | Usage |
|---|---|
| `NavbarComponent` | Sticky top nav with auth-aware UI, notification bell + dropdown, user avatar menu |
| `FooterComponent` | Site footer with links |
| `MentorCardComponent` | Mentor display card (browse, landing, profile pages) |
| `PaginationComponent` | Reusable pagination with Previous/Next + "Page X of Y" |
| `ConfirmDialogComponent` | Modal confirmation dialog (danger/primary/default variants) |
| `ToastComponent` | Toast notifications (success/error/info/warning, auto-dismiss) |

### Shared Services
| Service | Pattern |
|---|---|
| `ConfirmDialogService` | Promise-based `confirm()` → resolves true/false |
| `ToastService` | Pub/sub with `success()/error()/info()/warning()` methods, auto-dismiss timers |

---

## 15. Key Design Patterns & Rules

### Global Rule: BE-Driven Tables
**Every table/list with search, filters, or pagination MUST be BE-driven.** No client-side filtering or pagination. All queries go to Supabase with `.ilike()` for search, column filters, and `.range()` for pagination. Applies to:
- Mentor reports table
- Active mentees table
- Messages search
- Earnings history

### Component Patterns
- **Standalone components** — no NgModules, each component declares its imports
- **OnPush change detection** — all components use `ChangeDetectionStrategy.OnPush`
- **Angular control flow** — uses `@if`, `@for`, `@else` (not `*ngIf`, `*ngFor`)
- **Signals** — some components use Angular signals (`signal()`, `computed()`) alongside RxJS
- **Reactive forms** for complex forms, `ngModel` for simple inputs

### State Management Patterns
- **Auth slice owns session only** — `userId` + `activeRole`, not user data
- **Users slice is single source of truth** for all user profiles
- **Selector composition** — complex derived state via `createSelector` chains
- **Effects for side effects** — API calls, realtime setup, multi-dispatch orchestration
- **Reset on logout** — all slices reset to initial state

### API Patterns
- All methods return `Observable<T>`
- Uses `from()` to convert Supabase Promises to Observables
- `getCurrentUserId()` helper extracts auth user from session
- `assertRole()` helper validates user role before admin operations
- Foreign key joins via Supabase `.select()` syntax: `mentee_profile:profiles!mentorships_mentee_id_fkey(id, name, email)`
- Search uses `.ilike()`, pagination uses `.range()`, filtering uses `.eq()`

### Security
- **RLS (Row Level Security)** on all tables — queries respect authenticated user
- **sender_id always from session** — `sendMessage` ignores client-supplied senderId
- **Role assertion** for admin operations
- **Conversation partner profile reads** — custom RLS policy allows reading profile of conversation partner

---

## 16. File Structure

```
src/app/
├── core/
│   ├── constants.ts                    # App-wide constants
│   ├── constants/
│   │   └── display.constants.ts        # UI icon/color mappings
│   ├── guards/
│   │   └── auth.guard.ts               # All route guards
│   ├── icons/
│   │   └── fontawesome.icons.ts        # FA icon library
│   ├── layout/
│   │   ├── layout.component.ts         # Public layout (navbar + footer)
│   │   ├── registration-layout.component.ts  # Registration wizard layout
│   │   └── dashboard-layout.component.ts     # Dashboard layout (sidebar + content)
│   ├── models/
│   │   ├── auth.model.ts
│   │   ├── user.model.ts
│   │   ├── dashboard.model.ts
│   │   ├── database.types.ts           # Supabase schema types
│   │   ├── chat.model.ts
│   │   ├── mentor.model.ts
│   │   ├── registration.model.ts
│   │   └── testimonial.model.ts
│   ├── routes.ts                       # Centralized route path constants
│   ├── services/
│   │   ├── supabase.service.ts         # Supabase client singleton
│   │   ├── auth-api.service.ts         # All API methods (~1080 lines)
│   │   ├── realtime.service.ts         # Supabase Realtime subscriptions
│   │   └── app-initializer.service.ts  # App bootstrap
│   └── utils/
│       └── mentor.utils.ts             # Capacity parser
├── features/
│   ├── auth/
│   │   ├── smart/                      # Login, signup, forgot/reset password, verify email, suspended
│   │   ├── ui/                         # Form sub-components
│   │   └── store/                      # auth.actions, auth.effects, auth.reducer, auth.selectors
│   ├── dashboard/
│   │   ├── mentee-dashboard.component.ts
│   │   ├── mentor-dashboard.component.ts
│   │   ├── admin-dashboard.component.ts
│   │   ├── mentee/                     # 5 mentee pages (my-mentors, messages, payments, reports, settings)
│   │   ├── mentor/                     # 11 mentor pages (my-mentees, messages, earnings, reports, etc.)
│   │   ├── admin/                      # 7 admin pages (users, payments, reports, settings, etc.)
│   │   ├── shared/                     # Notifications page (shared across roles)
│   │   └── store/                      # dashboard.actions, dashboard.selectors
│   ├── public/
│   │   └── smart/                      # Landing, browse, mentor profile, reviews, how-it-works, about, help, terms, privacy
│   └── registration/
│       ├── smart/                      # 6-step wizard pages
│       ├── ui/                         # Form sub-components
│       └── store/                      # registration.actions, registration.effects, registration.reducer, registration.selectors
├── shared/
│   ├── components/                     # Navbar, footer, mentor-card, pagination, confirm-dialog, toast
│   └── services/                       # ConfirmDialogService, ToastService
├── store/
│   ├── app.state.ts                    # Root state interface
│   ├── app.reducer.ts                  # Root reducer map
│   ├── admin/                          # Admin state slice
│   ├── mentee/                         # Mentee state slice
│   ├── mentor/                         # Mentor state slice
│   ├── messaging/                      # Messaging state slice (EntityAdapter)
│   ├── notifications/                  # Notifications state slice
│   ├── platform/                       # Platform config slice
│   ├── reports/                        # Reports & reviews slice
│   ├── session/                        # Session effects (data loading orchestration)
│   └── users/                          # Users state slice (EntityAdapter)
├── app.routes.ts                       # Route definitions
└── main.ts                             # Bootstrap
```

---

## 17. Environment Configuration

The app uses Angular environment files for Supabase configuration:
- `supabaseUrl` — Supabase project URL
- `supabaseAnonKey` — Supabase anon/public API key

These are injected into `SupabaseService` which creates a singleton `SupabaseClient<Database>`.

---

## 18. Key Interfaces Quick Reference

```typescript
// User with all profile fields
interface User {
  id: string; name: string; email: string; role: UserRole;
  avatar: string; registered?: boolean; phone?: string;
  location?: string; gender?: string; jobTitle?: string;
  company?: string; yearsOfExperience?: string; bio?: string;
  skills?: string[]; tools?: string[]; portfolioUrl?: string;
  linkedin?: string; experiences?: UserExperience[];
  subscriptionCost?: string; mentorPlans?: MentorPlan[];
  availability?: string[]; menteeCapacity?: string;
  mentorApprovalStatus?: MentorApprovalStatus;
  status?: 'active' | 'suspended' | 'pending';
  joinDate?: string; acceptingMentees?: boolean;
  payoutAccount?: { type: 'bank'|'instapay'; bankName?; accountNumber?; instapayNumber? };
  notificationSettings?: { id: string; enabled: boolean }[];
}

// Mentor plan pricing
interface MentorPlan { id: string; duration: 'monthly'|'quarterly'|'6months'; price: string; }

// Work experience entry
interface UserExperience { id: string; title: string; company: string; startDate: string; endDate: string; current: boolean; description: string; }

// Mentorship request
interface PendingMentorshipRequest { id: number; mentorshipId?: string; menteeUuid?: string; name: string; goal: string; message: string; rating: number | null; }

// Mentee report (written by mentor)
interface MenteeReport { id: number; menteeId: string; mentorId: string; mentorName: string; menteeName?: string; createdAt: string; summary: string; rating?: number; behaviour?: string; strengths?: string[]; weaknesses?: string[]; areasToDevelop?: string[]; recommendations?: string; }

// Payment
interface PaymentRow { id: string; mentee_id: string; mentor_id: string; amount: number; currency: string; status: 'pending_confirmation'|'in_escrow'|'released'|'refunded'|'disputed'; plan_name?: string; month?: string; release_date?: string; paid_to_mentor: boolean; created_at: string; }

// Notification
interface AppNotification { id: string; userId: string; type: 'report_required'|'report_submitted'|'payment_released'|'new_message'|'mentorship_request'|'payment_updated'|'account_updated'; title: string; body: string; read: boolean; metadata: Record<string, unknown>; createdAt: string; }

// Chat
interface ChatConversation { id: string; mentorId: string; menteeId: string; mentorName: string; menteeName: string; lastMessage: string; lastTimestamp: string; status: 'active'|'past'; messages: ChatMessage[]; }
interface ChatMessage { id: number; senderId: string; text: string; timestamp: string; senderName: string; senderRole: UserRole; }
```
