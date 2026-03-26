# MentorChief MVP — Remaining Tasks

> Generated 2026-03-25 — validated against requirements, codebase, and Supabase DB

| # | Priority | Task | Requirement | Current State | Work Needed | DB Change |
|---|----------|------|-------------|---------------|-------------|-----------|
| 1 | P1 | Profile Photo Upload (Supabase Storage) | Registration Step 2 + Settings — JPG/PNG, max 10MB, stored in Supabase Storage | No storage bucket, no upload code. Avatar field is text (URL/null). Components show initials only | Create storage bucket, upload service, wire into personal-info step + mentee/mentor settings | No (uses Storage, not DB) |
| 2 | P1 | Mentor Reapply Flow | Rejected mentor clicks "Reapply" → all 6 steps pre-filled → status resets to pending | Rejected page only shows "contact support" mailto link. No reapply button | Add reapply button → navigate to registration step 1 with pre-filled data → reset mentor_approval_status to pending on submit | No |
| 3 | P1 | Admin — Create Payment Record | Admin verifies bank transfer → creates payment record → marks mentorship active | Admin payments page can only view/release. No "Create Payment" form | Add form: select mentorship, amount, plan, reference. Insert into payments. Optionally activate mentorship + create subscription + notify mentee | No |
| 4 | P1 | Admin — Report Validation & Rejection | Admin validates mentor report → payment released. Admin rejects → mentor rewrites with reason | mentorship-reports page is view-only. No validate/reject buttons. mentee_reports has no status column | Add status + rejection_reason columns to mentee_reports. Add validate/reject UI. On validate → allow escrow release. On reject → notify mentor | Yes: mentee_reports +status, +rejection_reason |
| 5 | P1 | Mentorship Plan Selection on Request | Mentee selects plan (monthly/quarterly/yearly) + optional message when requesting | mentorships table has no plan_name/plan_amount columns. Subscription is separate table | Add plan_name and plan_amount columns to mentorships. Wire into request mentorship flow | Yes: mentorships +plan_name, +plan_amount |
| 6 | P2 | Admin — Expertise Categories CRUD | Admin manages expertise categories (registration Step 4 + browse filter) | No expertise_categories table. No CRUD UI. Categories missing or hardcoded | Create expertise_categories table + CRUD in admin settings + use in registration biography step + browse filter | Yes: new expertise_categories table |
| 7 | P2 | Admin — Price Range Filters CRUD | Admin manages price range options for browse mentors filter | Browse page has hardcoded ranges (0-100, 100-150, etc.). No admin management | Create price_range_filters config or add to platform_config + CRUD in admin settings + use in browse page | Yes: platform_config or new table |
| 8 | P2 | Admin — Reject Mentor with Reason | Rejection includes optional reason displayed on mentor's rejected page | rejectMentor() exists but profiles has no rejection_reason column. Rejected page doesn't show reason | Add rejection_reason to profiles. Pass reason from admin UI. Display on rejected page | Yes: profiles +rejection_reason |
| 9 | P2 | Admin — Mark Mentorship Active | After payment verified, admin activates mentorship → mentee notified "mentorship started" | No explicit admin action to activate mentorship. Status transitions not admin-controlled | Add admin action: mentorship pending→active, set started_at, create subscription, notify mentee | No |
| 10 | P2 | Admin — Mark Payment as Refunded | Admin marks payments refunded (3-day cancel, timeout, deadline exceeded) | Only releasePayment() exists. No refund action | Add refund action: update payment status to refunded + cancel subscription + end mentorship + notify | No |
| 11 | P2 | Admin — Soft Delete User | Soft delete with confirmation, cannot delete admins, refunds all + closes subscriptions | Only suspend/activate in users page. No delete flow | Add delete button (hidden for admins), confirmation, cascade: refund payments, cancel subs, end mentorships, mark deleted | Yes: profiles +deleted_at or +is_deleted |
| 12 | P2 | Admin — Platform Settings (Full) | General (name, tagline, logo, WhatsApp), Financial (commission, min price, escrow, refund window), Limits (capacity, timeouts, deadlines), Security (reset expiry, cooldown), Content (categories, ranges) | Only has: platform_fee_percent, escrow_days, min/max_subscription_price, maintenance_mode | Expand platform_config with all missing columns. Add all sections to settings UI | Yes: platform_config +many columns |
| 13 | P3 | In-App Notifications (Full Coverage) | 18+ notification types across mentee/mentor/admin per requirements | Infrastructure exists (table, store, realtime). Only a few types created (report submitted, accept/decline). Most lifecycle events don't create notifications | Add notification creation calls for ALL events: approved/rejected, payment completed/released, request expired, cancelled, subscription ending, new user, etc. | No |
| 14 | P3 | Email Sending Infrastructure | 18+ email types (verification, welcome, approval, acceptance, reports, reminders, etc.) | Zero email infrastructure. No edge functions. No email provider | Set up Supabase Edge Functions + email provider (Resend/SendGrid). Create templates. Trigger on each lifecycle event | No (Edge Functions) |
| 15 | P4 | File Attachments in Messages | Docs, images, PDFs, max 30MB via Supabase Storage | Messages are text-only. No upload UI, no attachment columns on messages table | Add attachment_url + attachment_type to messages. Storage bucket for attachments. File picker UI in chat | Yes: messages +attachment_url, +attachment_type |
| 16 | P4 | Search Within Conversation | Search messages within a specific conversation | Conversation list search exists but no within-conversation search | Add search input in chat view, filter messages by text content | No |
| 17 | P5 | Browse Mentors — Sort Options | Sort by price, rating, latest (default) | Filter by category/price exists. No sort dropdown | Add sort dropdown + apply client-side sorting | No |
| 18 | P5 | Mentor Profile — Full Public View | Accepting status, total mentee count, response time, first 3 reviews + "view all", pricing plans | Shows basic info. Missing: response time, total mentee count, accepting badge, reviews section | Add computed fields, reviews section with "view all" link, pricing plans display | No |
| 19 | P5 | Landing Page — Admin-Selected Featured Mentors | Featured mentors picked by admin | Shows first 3 approved mentors (arbitrary order) | Add featured boolean to profiles. Admin UI to toggle. Landing page queries featured only | Yes: profiles +featured |
| 20 | P5 | 404 Page | Proper 404 page for invalid URLs | Wildcard route silently redirects to home | Create NotFoundComponent, update wildcard route | No |
| 21 | P6 | Mentorship Request Expiry (5 days) | Pending requests auto-expire after 5 days, mentee notified | No expiry logic anywhere | Supabase cron (pg_cron) or Edge Function. Query pending mentorships >5 days → cancel → notify | No (pg_cron) |
| 22 | P6 | Payment Timeout (24h) | If mentee doesn't pay within 24h after acceptance, admin cancels | No timeout logic | Cron or admin visual indicator for overdue payments | No |
| 23 | P6 | Report Deadline Enforcement (1 week) | Reminder at 3 days. Forfeiture + mentee refund at 1 week | No deadline tracking, no reminders | Track plan end date. Cron for 3-day reminder + 1-week auto-refund | No |
| 24 | P6 | Subscription Ending Soon Notification (3 days) | Both mentor and mentee notified 3 days before plan ends | No logic for this | Cron to check next_billing_date − 3 days → send notifications | No |
| 25 | P7 | Registration Step 4 — Primary Expertise Category | Required for mentors, from admin-managed list | No expertise_category field on profiles. Biography step missing this field | Add column to profiles, add dropdown to biography step (depends on #6) | Yes: profiles +expertise_category |
| 26 | P7 | Registration Step 5 — Pricing Plan Validation | Monthly required min $50, quarterly min $150, yearly min $600. Mentor sets price | mentor_plans is jsonb. Need to verify min price enforcement | Validate form enforces min prices per plan type. Connect to platform_config.min_subscription_price | No |
| 27 | P7 | Registration Step 5 — Payout Account | Bank (name + account 10-20 digits) OR Instapay (01XXXXXXXXX) — required during registration | Payout account exists in earnings page but may not be in registration Step 5 | Ensure payout account form is in preference registration step | No |
| 28 | P7 | Mentor Capacity Fixed by Admin | Capacity fixed at 5 (or admin-set value), not changeable by mentor | mentee_capacity is text on profiles. May be editable by mentor | Enforce capacity from platform_config.mentor_capacity_limit. Remove mentor edit ability | No |
| 29 | P8 | Mentor Profile — Request Button States | "Already your mentor" / "Request Pending" + cancel / disabled at capacity / disabled not accepting | Partially implemented | Verify and fix all button state conditions on mentor profile page | No |
| 30 | P8 | Payment Accepted Popup with WhatsApp Link | Mentor accepts → mentee gets popup with admin WhatsApp link | Notification exists but no WhatsApp link to admin included | Add admin WhatsApp from platform_config to acceptance notification metadata. Show in popup | No |
| 31 | P8 | Mentee — Past Mentorships Section | My Mentors shows past mentorships with view report + leave/edit review | Need to verify past section exists with proper review flow | Ensure completed mentorships show with review/report options | No |
| 32 | P8 | Help Page — Contact Support | FAQ + contact support form/link | Static help categories exist. Contact support unclear | Add contact support section (email/WhatsApp link) | No |
| 33 | P8 | Mobile Responsive + Hamburger Menu | Mobile responsive with hamburger menu | Tailwind used but responsive behavior unverified | Test and fix responsive breakpoints, verify hamburger menu | No |
| 34 | P8 | Admin — Recent Activity Feed (Real Data) | Real timeline: registrations, applications, payments, disputes, suspensions | Dashboard shows stats but activity feed may not cover all events | Derive from existing data or create admin_activities table | Maybe |
| 35 | P8 | Admin — Messages (Read-Only Moderation) | Admin reads all conversations, cannot send | Admin messages page exists but read-only enforcement unverified | Verify read-only mode, ensure all conversations visible | No |

## Summary

| Priority | Count | Category |
|----------|-------|----------|
| P1 — Core Flow Blockers | 5 | App unusable without these |
| P2 — Admin Controls | 7 | Admin cannot operate platform |
| P3 — Notifications & Emails | 2 | Users won't know what's happening |
| P4 — Messaging Gaps | 2 | Incomplete chat experience |
| P5 — Public Pages | 4 | Browse/profile/landing gaps |
| P6 — Scheduled Automation | 4 | Timeouts & reminders |
| P7 — Registration/Settings | 4 | Form completeness |
| P8 — Minor UI/UX | 7 | Polish & edge cases |
| **Total** | **35** | |

## DB Migrations Needed

| Table | Changes |
|-------|---------|
| mentee_reports | +status (text), +rejection_reason (text) |
| mentorships | +plan_name (text), +plan_amount (numeric) |
| profiles | +rejection_reason (text), +expertise_category (text), +featured (boolean) |
| messages | +attachment_url (text), +attachment_type (text) |
| platform_config | +platform_name, +tagline, +logo_url, +admin_whatsapp, +refund_window_days, +mentor_capacity_limit, +payment_timeout_hours, +request_expiry_days, +report_deadline_days, +report_reminder_days, +max_attachment_size_mb, +reset_link_expiry_min, +reset_link_cooldown_min, +currency |
| NEW: expertise_categories | id, name, created_at |
