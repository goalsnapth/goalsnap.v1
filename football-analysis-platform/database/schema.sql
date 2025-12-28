-- Run this in Supabase SQL Editor
create extension if not exists "uuid-ossp";

create type subscription_tier as enum ('free', 'premium', 'vip');
create type match_status as enum ('scheduled', 'live', 'finished');
create type market_type as enum ('1x2', 'over_under', 'handicap');
create type tx_status as enum ('pending', 'confirmed', 'failed');

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  subscription_status subscription_tier default 'free',
  subscription_expiry timestamptz,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  external_id text unique,
  home_team text not null,
  away_team text not null,
  league text,
  match_time timestamptz not null,
  status match_status default 'scheduled',
  live_stats jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table public.predictions (
  id bigserial primary key,
  match_id uuid references public.matches(id) on delete cascade,
  market market_type not null,
  prediction_value text not null,
  ai_score float check (ai_score >= 0 and ai_score <= 100),
  is_premium boolean default false,
  created_at timestamptz default now()
);

create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  tx_hash text unique not null,
  amount_usdt numeric(10, 2) not null,
  network text not null,
  status tx_status default 'pending',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table matches enable row level security;
create policy "Public read matches" on matches for select to authenticated, anon using (true);
create policy "Users see own profile" on profiles for select using (auth.uid() = id);