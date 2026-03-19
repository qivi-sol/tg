alter table public.users
  add column if not exists last_ad_reward_at timestamptz;

create or replace function public.claim_daily_reward_action(
  p_user_id uuid,
  p_cooldown_hours integer default 24
)
returns table (
  user_id uuid,
  day_index integer,
  reward_type text,
  reward_value bigint,
  reward_label text,
  next_claim_at timestamptz
)
language plpgsql
as $$
declare
  v_user public.users%rowtype;
  v_claim_count integer;
  v_now timestamptz := timezone('utc', clock_timestamp());
  v_day_index integer;
  v_reward_type text;
  v_reward_value bigint;
  v_reward_label text;
begin
  select *
    into v_user
  from public.users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND:User not found.';
  end if;

  if v_user.last_daily_claim_at is not null
     and v_user.last_daily_claim_at + make_interval(hours => p_cooldown_hours) > v_now then
    raise exception 'RATE_LIMIT:Daily reward is still on cooldown.';
  end if;

  select count(*)
    into v_claim_count
  from public.daily_claims
  where user_id = p_user_id;

  case mod(v_claim_count, 3)
    when 0 then
      v_day_index := 1;
      v_reward_type := 'keys';
      v_reward_value := 2;
      v_reward_label := '+2 Keys';
    when 1 then
      v_day_index := 2;
      v_reward_type := 'coins';
      v_reward_value := 500;
      v_reward_label := '+500 Coins';
    else
      v_day_index := 3;
      v_reward_type := 'shards';
      v_reward_value := 1;
      v_reward_label := '+1 Shard';
  end case;

  update public.users
  set keys = keys + case when v_reward_type = 'keys' then v_reward_value::integer else 0 end,
      coins = coins + case when v_reward_type = 'coins' then v_reward_value else 0 end,
      shards = shards + case when v_reward_type = 'shards' then v_reward_value::integer else 0 end,
      active_days = active_days + 1,
      last_daily_claim_at = v_now
  where id = p_user_id;

  insert into public.daily_claims (
    user_id,
    reward_type,
    reward_value,
    claimed_at
  )
  values (
    p_user_id,
    v_reward_type,
    v_reward_value,
    v_now
  );

  insert into public.economy_logs (
    user_id,
    type,
    currency,
    amount,
    meta
  )
  values (
    p_user_id,
    'daily_claim',
    v_reward_type,
    v_reward_value,
    jsonb_build_object('day_index', v_day_index)
  );

  return query
  select
    p_user_id,
    v_day_index,
    v_reward_type,
    v_reward_value,
    v_reward_label,
    v_now + make_interval(hours => p_cooldown_hours);
end;
$$;

create or replace function public.claim_ad_reward_action(
  p_user_id uuid,
  p_cooldown_minutes integer default 30,
  p_key_reward integer default 1
)
returns table (
  user_id uuid,
  reward_type text,
  reward_value bigint,
  reward_label text,
  next_claim_at timestamptz
)
language plpgsql
as $$
declare
  v_user public.users%rowtype;
  v_now timestamptz := timezone('utc', clock_timestamp());
begin
  select *
    into v_user
  from public.users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND:User not found.';
  end if;

  if v_user.last_ad_reward_at is not null
     and v_user.last_ad_reward_at + make_interval(mins => p_cooldown_minutes) > v_now then
    raise exception 'RATE_LIMIT:Rewarded ad is still on cooldown.';
  end if;

  update public.users
  set keys = keys + p_key_reward,
      last_ad_reward_at = v_now
  where id = p_user_id;

  insert into public.economy_logs (
    user_id,
    type,
    currency,
    amount,
    meta
  )
  values (
    p_user_id,
    'ad_reward',
    'keys',
    p_key_reward,
    jsonb_build_object(
      'cooldown_minutes', p_cooldown_minutes,
      'source', 'rewarded_ad'
    )
  );

  return query
  select
    p_user_id,
    'keys',
    p_key_reward::bigint,
    '+' || p_key_reward || ' Key',
    v_now + make_interval(mins => p_cooldown_minutes);
end;
$$;

comment on function public.claim_ad_reward_action(uuid, integer, integer) is
  'Atomically grants the rewarded-ad key payout and enforces a simple cooldown for MVP anti-abuse.';
