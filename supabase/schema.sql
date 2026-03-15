-- ============================================================
-- MentorChief Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- One row per user, linked to auth.users via id
-- ============================================================
create table if not exists public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  name            text not null,
  email           text not null unique,
  role            text not null check (role in ('mentee', 'mentor', 'admin')),
  avatar          text,
  registered      boolean not null default false,
  phone           text,
  location        text,
  gender          text,
  job_title       text,
  company         text,
  years_of_experience text,
  bio             text,
  skills          text[],
  tools           text[],
  portfolio_url   text,
  linkedin        text,
  subscription_cost text,
  mentor_plans    jsonb,
  availability    text[],
  mentee_capacity text,
  mentor_approval_status text check (mentor_approval_status in ('pending', 'approved', 'rejected')),
  status          text not null default 'active' check (status in ('active', 'suspended', 'pending')),
  join_date       text,
  experiences     jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- MENTORSHIPS
-- Tracks mentor-mentee relationships and their lifecycle
-- ============================================================
create table if not exists public.mentorships (
  id            uuid primary key default uuid_generate_v4(),
  mentee_id     uuid not null references public.profiles(id) on delete cascade,
  mentor_id     uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'active', 'completed', 'cancelled')),
  goal          text,
  message       text,
  progress      integer not null default 0 check (progress >= 0 and progress <= 100),
  months_active integer not null default 0,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- SUBSCRIPTIONS
-- One active subscription per mentee (manual payment model)
-- ============================================================
create table if not exists public.subscriptions (
  id                uuid primary key default uuid_generate_v4(),
  mentee_id         uuid not null references public.profiles(id) on delete cascade,
  mentor_id         uuid not null references public.profiles(id) on delete cascade,
  plan_name         text not null,
  amount            numeric(10,2) not null,
  currency          text not null default 'USD',
  status            text not null default 'active' check (status in ('active', 'cancelled', 'past_due')),
  next_billing_date date,
  started_at        timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- PAYMENTS
-- Manual payment flow: mentee submits proof → admin confirms
-- ============================================================
create table if not exists public.payments (
  id                  uuid primary key default uuid_generate_v4(),
  mentee_id           uuid not null references public.profiles(id) on delete cascade,
  mentor_id           uuid not null references public.profiles(id) on delete cascade,
  amount              numeric(10,2) not null,
  currency            text not null default 'USD',
  status              text not null default 'pending_confirmation'
                        check (status in ('pending_confirmation', 'in_escrow', 'released', 'refunded', 'disputed')),
  payment_reference   text,
  payment_proof_url   text,
  plan_name           text,
  month               text,
  release_date        date,
  paid_to_mentor      boolean not null default false,
  admin_notes         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- CONVERSATIONS
-- One conversation per mentor-mentee pair
-- ============================================================
create table if not exists public.conversations (
  id              uuid primary key default uuid_generate_v4(),
  mentor_id       uuid not null references public.profiles(id) on delete cascade,
  mentee_id       uuid not null references public.profiles(id) on delete cascade,
  last_message    text,
  last_timestamp  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(mentor_id, mentee_id)
);

-- ============================================================
-- MESSAGES
-- Messages within a conversation
-- ============================================================
create table if not exists public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  text            text not null,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- MENTOR UNREAD COUNTS
-- Tracks unread message counts per mentor per conversation
-- ============================================================
create table if not exists public.mentor_unread (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  mentor_id       uuid not null references public.profiles(id) on delete cascade,
  unread_count    integer not null default 0,
  primary key (conversation_id, mentor_id)
);

-- ============================================================
-- MENTEE REPORTS
-- Formal reports mentors write about mentees after completion
-- ============================================================
create table if not exists public.mentee_reports (
  id              uuid primary key default uuid_generate_v4(),
  mentee_id       uuid not null references public.profiles(id) on delete cascade,
  mentor_id       uuid not null references public.profiles(id) on delete cascade,
  mentor_name     text not null,
  summary         text not null,
  rating          integer not null check (rating >= 1 and rating <= 5),
  behaviour       text not null,
  strengths       text[] not null default '{}',
  weaknesses      text[] not null default '{}',
  areas_to_develop text[] not null default '{}',
  recommendations text not null,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- MENTOR REVIEWS
-- Reviews mentees write about mentors (one per mentor per mentee)
-- ============================================================
create table if not exists public.mentor_reviews (
  id           uuid primary key default uuid_generate_v4(),
  mentor_id    uuid not null references public.profiles(id) on delete cascade,
  mentee_id    uuid not null references public.profiles(id) on delete cascade,
  rating       integer not null check (rating >= 1 and rating <= 5),
  comment      text,
  submitted_at timestamptz not null default now(),
  unique(mentor_id, mentee_id)
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger mentorships_updated_at before update on public.mentorships
  for each row execute function public.handle_updated_at();

create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.handle_updated_at();

create trigger payments_updated_at before update on public.payments
  for each row execute function public.handle_updated_at();

create trigger conversations_updated_at before update on public.conversations
  for each row execute function public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- Runs after a new user is inserted into auth.users
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, avatar, registered, status, join_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'mentee'),
    coalesce(new.raw_user_meta_data->>'avatar', upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 2))),
    false,
    'active',
    to_char(now(), 'Mon DD, YYYY')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.mentorships enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.mentor_unread enable row level security;
alter table public.mentee_reports enable row level security;
alter table public.mentor_reviews enable row level security;

-- PROFILES policies
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Mentees can read mentor profiles"
  on public.profiles for select using (role = 'mentor');

create policy "Admins can read all profiles"
  on public.profiles for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update all profiles"
  on public.profiles for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- MENTORSHIPS policies
create policy "Users can see their own mentorships"
  on public.mentorships for select using (
    auth.uid() = mentee_id or auth.uid() = mentor_id
  );

create policy "Mentees can create mentorship requests"
  on public.mentorships for insert with check (auth.uid() = mentee_id);

create policy "Mentor can update mentorship they are part of"
  on public.mentorships for update using (
    auth.uid() = mentor_id or auth.uid() = mentee_id
  );

create policy "Admins can see all mentorships"
  on public.mentorships for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- PAYMENTS policies
create policy "Users can see their own payments"
  on public.payments for select using (
    auth.uid() = mentee_id or auth.uid() = mentor_id
  );

create policy "Mentees can insert payments"
  on public.payments for insert with check (auth.uid() = mentee_id);

create policy "Admins can see and update all payments"
  on public.payments for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- SUBSCRIPTIONS policies
create policy "Users can see their own subscriptions"
  on public.subscriptions for select using (
    auth.uid() = mentee_id or auth.uid() = mentor_id
  );

create policy "Mentees can insert subscriptions"
  on public.subscriptions for insert with check (auth.uid() = mentee_id);

create policy "Mentees can update own subscriptions"
  on public.subscriptions for update using (auth.uid() = mentee_id);

create policy "Admins can manage all subscriptions"
  on public.subscriptions for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- CONVERSATIONS policies
create policy "Users can see their own conversations"
  on public.conversations for select using (
    auth.uid() = mentor_id or auth.uid() = mentee_id
  );

create policy "Users can create conversations they are part of"
  on public.conversations for insert with check (
    auth.uid() = mentor_id or auth.uid() = mentee_id
  );

create policy "Admins can see all conversations"
  on public.conversations for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- MESSAGES policies
create policy "Users can see messages in their conversations"
  on public.messages for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.mentor_id = auth.uid() or c.mentee_id = auth.uid())
    )
  );

create policy "Users can send messages in their conversations"
  on public.messages for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.mentor_id = auth.uid() or c.mentee_id = auth.uid())
    )
  );

-- MENTOR UNREAD policies
create policy "Mentors can see their own unread counts"
  on public.mentor_unread for select using (auth.uid() = mentor_id);

create policy "Mentors can update their own unread counts"
  on public.mentor_unread for all using (auth.uid() = mentor_id);

-- MENTEE REPORTS policies
create policy "Mentors can create reports for their mentees"
  on public.mentee_reports for insert with check (auth.uid() = mentor_id);

create policy "Users can read reports about them or by them"
  on public.mentee_reports for select using (
    auth.uid() = mentee_id or auth.uid() = mentor_id
  );

create policy "Admins can see all reports"
  on public.mentee_reports for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- MENTOR REVIEWS policies
create policy "Mentees can submit reviews"
  on public.mentor_reviews for insert with check (auth.uid() = mentee_id);

create policy "Anyone can read reviews"
  on public.mentor_reviews for select using (true);

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_mentor_approval on public.profiles(mentor_approval_status) where role = 'mentor';
create index if not exists idx_mentorships_mentee on public.mentorships(mentee_id);
create index if not exists idx_mentorships_mentor on public.mentorships(mentor_id);
create index if not exists idx_mentorships_status on public.mentorships(status);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_created on public.messages(created_at);
create index if not exists idx_mentee_reports_mentee on public.mentee_reports(mentee_id);
create index if not exists idx_mentor_reviews_mentor on public.mentor_reviews(mentor_id);
