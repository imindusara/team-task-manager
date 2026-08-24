-- ==============================================================================
-- SUPABASE SCHEMA FOR 6-PERSON COMPANY TEAM TASK MANAGEMENT WEB APP
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Profiles Table (Team Members + Manager)
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  role text not null check (role in ('manager', 'staff')),
  department text not null,
  title text not null,
  avatar_url text,
  color text default '#6366f1',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Tasks Table
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  category text not null check (category in ('daily', 'weekly', 'hr', 'general')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  completed_by uuid references public.profiles(id) on delete set null,
  completion_note text,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;

-- Open policies for team collaboration (can be refined for auth users)
drop policy if exists "Allow public read on profiles" on public.profiles;
create policy "Allow public read on profiles" on public.profiles for select using (true);

drop policy if exists "Allow public insert/update on profiles" on public.profiles;
create policy "Allow public insert/update on profiles" on public.profiles for all using (true);

drop policy if exists "Allow public read on tasks" on public.tasks;
create policy "Allow public read on tasks" on public.tasks for select using (true);

drop policy if exists "Allow public insert on tasks" on public.tasks;
create policy "Allow public insert on tasks" on public.tasks for insert with check (true);

drop policy if exists "Allow public update on tasks" on public.tasks;
create policy "Allow public update on tasks" on public.tasks for update using (true);

drop policy if exists "Allow public delete on tasks" on public.tasks;
create policy "Allow public delete on tasks" on public.tasks for delete using (true);

-- 5. Trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- 6. Setup Supabase Realtime Publication
-- Enables live sync for instant task ticking & notifications
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.profiles;

-- 7. Seed Initial 6-Person Team Members + Manager
insert into public.profiles (id, name, email, role, department, title, avatar_url, color)
values
  ('11111111-1111-1111-1111-111111111111', 'Alex Rivera', 'alex@company.com', 'manager', 'Executive / Ops', 'Operations Lead & Manager', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '#6366f1'),
  ('22222222-2222-2222-2222-222222222222', 'Sarah Chen', 'sarah@company.com', 'staff', 'Engineering', 'Senior Frontend Engineer', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', '#06b6d4'),
  ('33333333-3333-3333-3333-333333333333', 'Marcus Brody', 'marcus@company.com', 'staff', 'Engineering', 'Backend & Cloud Architect', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '#8b5cf6'),
  ('44444444-4444-4444-4444-444444444444', 'Elena Rostova', 'elena@company.com', 'staff', 'HR & People', 'People Ops & HR Specialist', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', '#ec4899'),
  ('55555555-5555-5555-5555-555555555555', 'David Kim', 'david@company.com', 'staff', 'Quality & Support', 'QA Lead & Support Specialist', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', '#10b981'),
  ('66666666-6666-6666-6666-666666666666', 'Priya Patel', 'priya@company.com', 'staff', 'Design', 'UI/UX Product Designer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '#f59e0b')
on conflict (id) do nothing;

-- 8. Seed Initial Realistic Tasks (Daily, Weekly, HR, General)
insert into public.tasks (title, description, category, priority, status, assigned_to, created_by, due_date, tags)
values
  -- Daily Tasks
  ('Morning Standup & Task Board Triage', 'Review blockers and coordinate pull request reviews with Marcus and Sarah.', 'daily', 'high', 'pending', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', timezone('utc'::text, now() + interval '4 hours'), array['standup', 'ops']),
  ('Database Backup Health Check & Error Log Audit', 'Verify automatic automated snapshots in Supabase and check server error logs.', 'daily', 'urgent', 'completed', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', timezone('utc'::text, now() - interval '2 hours'), array['devops', 'infra']),
  ('Review Customer Feedback & Triage Support Tickets', 'Clear daily inbox and log recurring bugs in QA backlog.', 'daily', 'medium', 'pending', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', timezone('utc'::text, now() + interval '6 hours'), array['support', 'customer']),

  -- Weekly Tasks
  ('Complete Design System Component Specs (v2.2)', 'Finalize token colors, dark mode tokens, and input field states in Figma.', 'weekly', 'high', 'pending', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', timezone('utc'::text, now() + interval '3 days'), array['design', 'figma']),
  ('Implement Redis Cache Layer for Task Queries', 'Reduce API latency for team overview aggregates.', 'weekly', 'high', 'pending', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', timezone('utc'::text, now() + interval '4 days'), array['backend', 'performance']),
  ('Release v1.4 Regression Testing Plan', 'Run test suites on responsive mobile view and verify Safari/Chrome compatibility.', 'weekly', 'medium', 'pending', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', timezone('utc'::text, now() + interval '2 days'), array['qa', 'testing']),

  -- HR & Department Tasks
  ('Annual Leave Policy Review & Approval', 'Approve Q4 leave submissions and update shared vacation calendar.', 'hr', 'high', 'completed', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', timezone('utc'::text, now() - interval '1 day'), array['hr', 'policy']),
  ('Submit Monthly Health Insurance Stipend Paperwork', 'Submit receipt receipts for wellness and healthcare allowances.', 'hr', 'medium', 'pending', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', timezone('utc'::text, now() + interval '5 days'), array['hr', 'benefits']),
  ('Prepare Q3 Performance Review Forms', 'Distribute self-assessment forms to all 6 team members.', 'hr', 'urgent', 'pending', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', timezone('utc'::text, now() + interval '1 day'), array['hr', 'performance']),

  -- General Tasks
  ('Organize Virtual Team Coffee & Lightning Talks', 'Book 45 mins session for Friday lightning talks on AI tooling.', 'general', 'low', 'pending', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', timezone('utc'::text, now() + interval '4 days'), array['culture', 'team']),
  ('Upgrade Node.js Runtime to LTS in CI/CD Pipeline', 'Ensure GitHub Actions run on Node 20 LTS.', 'general', 'medium', 'completed', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', timezone('utc'::text, now() - interval '3 days'), array['ci-cd', 'devops'])
on conflict do nothing;
