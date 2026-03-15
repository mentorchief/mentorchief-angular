-- ============================================================
-- FIX: RLS infinite recursion on profiles table
-- The admin policies were querying profiles from within a profiles
-- policy, causing infinite recursion. Fix: use auth.jwt() claims
-- or a security definer function instead.
-- ============================================================

-- Drop all existing profiles policies
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Mentees can read mentor profiles" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

-- Drop admin policies on other tables that had the same recursion
drop policy if exists "Admins can see all mentorships" on public.mentorships;
drop policy if exists "Admins can see and update all payments" on public.payments;
drop policy if exists "Admins can manage all subscriptions" on public.subscriptions;
drop policy if exists "Admins can see all conversations" on public.conversations;
drop policy if exists "Admins can see all reports" on public.mentee_reports;

-- ============================================================
-- Create a security definer function to check admin role
-- This avoids the recursion by running with elevated privileges
-- ============================================================
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ============================================================
-- Re-create PROFILES policies (no recursion)
-- ============================================================
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Anyone authenticated can read mentor/mentee profiles (for browse page)
create policy "Authenticated users can read all profiles"
  on public.profiles for select using (auth.role() = 'authenticated');

create policy "Admins can update all profiles"
  on public.profiles for update using (public.is_admin());

-- ============================================================
-- Re-create other table admin policies using is_admin()
-- ============================================================
create policy "Admins can see all mentorships"
  on public.mentorships for select using (public.is_admin());

create policy "Admins can see and update all payments"
  on public.payments for all using (public.is_admin());

create policy "Admins can manage all subscriptions"
  on public.subscriptions for all using (public.is_admin());

create policy "Admins can see all conversations"
  on public.conversations for select using (public.is_admin());

create policy "Admins can see all reports"
  on public.mentee_reports for select using (public.is_admin());
