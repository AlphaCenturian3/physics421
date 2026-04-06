-- Run in Supabase SQL editor

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  role text default 'student',
  created_at timestamptz default now()
);

-- Progress table
create table public.progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  topic_id text not null,
  viewed_at timestamptz default now(),
  unique(user_id, topic_id)
);

-- Practice attempts table
create table public.practice_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  topic_ids text[] not null,
  score integer,
  total integer,
  completed_at timestamptz default now()
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.practice_attempts enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can read own progress" on public.progress for select using (auth.uid() = user_id);
create policy "Users can write own progress" on public.progress for insert with check (auth.uid() = user_id);
create policy "Users can read own attempts" on public.practice_attempts for select using (auth.uid() = user_id);
create policy "Users can write own attempts" on public.practice_attempts for insert with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
