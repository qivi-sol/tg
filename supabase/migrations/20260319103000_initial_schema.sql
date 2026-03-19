create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id text not null unique,
  username text,
  first_name text,
  avatar_url text,
  coins bigint not null default 0 check (coins >= 0),
  keys integer not null default 5 check (keys >= 0),
  shards integer not null default 0 check (shards >= 0),
  vault_level integer not null default 1 check (vault_level >= 1),
  active_days integer not null default 1 check (active_days >= 1),
  total_raids integer not null default 0 check (total_raids >= 0),
  total_coins_earned bigint not null default 0 check (total_coins_earned >= 0),
  total_shards_earned integer not null default 0 check (total_shards_earned >= 0),
  referral_code text not null unique,
  referred_by uuid references public.users(id) on delete set null,
  last_daily_claim_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create table if not exists public.raids (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'lost', 'cashed_out', 'won')),
  temporary_coins bigint not null default 0 check (temporary_coins >= 0),
  temporary_shards integer not null default 0 check (temporary_shards >= 0),
  multiplier_factor numeric(6,2) not null default 1.00 check (multiplier_factor >= 1),
  opened_cells_count integer not null default 0 check (opened_cells_count between 0 and 8),
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  last_action_at timestamptz
);

create unique index if not exists raids_one_active_per_user_idx
  on public.raids(user_id)
  where status = 'active';

create index if not exists raids_user_status_idx
  on public.raids(user_id, status, started_at desc);

create table if not exists public.raid_cells (
  id uuid primary key default gen_random_uuid(),
  raid_id uuid not null references public.raids(id) on delete cascade,
  cell_index smallint not null check (cell_index between 0 and 8),
  cell_type text not null check (cell_type in ('coin', 'multiplier', 'bomb', 'shard')),
  value numeric(10,2) not null default 0,
  revealed boolean not null default false,
  unique (raid_id, cell_index)
);

create index if not exists raid_cells_raid_idx
  on public.raid_cells(raid_id, cell_index);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references public.users(id) on delete cascade,
  invited_user_id uuid not null unique references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  check (inviter_user_id <> invited_user_id)
);

create index if not exists referrals_inviter_idx
  on public.referrals(inviter_user_id, created_at desc);

create table if not exists public.daily_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reward_type text not null check (reward_type in ('coins', 'keys', 'shards')),
  reward_value bigint not null,
  claimed_at timestamptz not null default timezone('utc', now())
);

create index if not exists daily_claims_user_idx
  on public.daily_claims(user_id, claimed_at desc);

create table if not exists public.economy_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  currency text not null check (currency in ('coins', 'keys', 'shards')),
  amount bigint not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists economy_logs_user_idx
  on public.economy_logs(user_id, created_at desc);

alter table public.users enable row level security;
alter table public.raids enable row level security;
alter table public.raid_cells enable row level security;
alter table public.referrals enable row level security;
alter table public.daily_claims enable row level security;
alter table public.economy_logs enable row level security;

revoke all on public.users from anon, authenticated;
revoke all on public.raids from anon, authenticated;
revoke all on public.raid_cells from anon, authenticated;
revoke all on public.referrals from anon, authenticated;
revoke all on public.daily_claims from anon, authenticated;
revoke all on public.economy_logs from anon, authenticated;

comment on table public.users is 'TON Vault player profiles. Access through Edge Functions with the service role.';
comment on table public.raids is 'Server-owned raid sessions. Client should never write directly.';
comment on column public.raids.last_action_at is 'Used for simple rapid-tap rate limiting.';
