-- ==============================================================================
-- SUPABASE SCHEMA FOR 6-PERSON COMPANY TEAM TASK MANAGEMENT WEB APP
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Profiles Table (6 Company Members)
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  username text unique not null,
  email text unique not null,
  department text not null,
  role text not null check (role in ('admin', 'member')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tasks Table
create table if not exists public.tasks (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  task_type text not null default 'general' check (task_type in ('daily', 'weekly', 'hr', 'general')),
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  is_completed boolean not null default false,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  completion_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;

-- Open policies for team collaboration
drop policy if exists "Allow public all profiles" on public.profiles;
create policy "Allow public all profiles" on public.profiles for all using (true);

drop policy if exists "Allow public all tasks" on public.tasks;
create policy "Allow public all tasks" on public.tasks for all using (true);

-- 5. Realtime Channel Setup
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.profiles;

-- 6. Pre-seeded 6-Person Team Members
insert into public.profiles (id, full_name, username, email, department, role)
values
  ('b8807887-5805-4005-bea3-c77ec4472543', 'Ashan Indusara', 'ashan', 'ashan@company.com', 'HR', 'admin'),
  ('3b3b123b-a606-4a0e-a740-d6971398b4da', 'Widura Bandara', 'widura', 'widura@company.com', 'HR', 'admin'),
  ('5104abf7-3390-4271-af10-bab94bf26816', 'Sahan', 'sahan', 'sahan@company.com', 'Financial', 'member'),
  ('276585a2-6b0c-45b7-8840-7dbd2b714730', 'Sadeepa', 'sadeepa', 'sadeepa@company.com', 'Production team', 'member'),
  ('bc767381-0864-48c0-b004-6f0037dc8e02', 'Pulasthi', 'pulasthi', 'pulasthi@company.com', 'Production team', 'member'),
  ('eb683a86-5664-43c9-9bd8-6590cf01d81a', 'Subodha', 'subodha', 'subodha@company.com', 'Marketing', 'member')
on conflict (id) do nothing;
