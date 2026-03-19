create or replace function public.compute_vault_points(
  p_active_days integer,
  p_total_raids integer,
  p_total_coins_earned bigint,
  p_total_shards_earned integer
)
returns integer
language sql
immutable
as $$
  select
    greatest(0, p_active_days) * 18 +
    greatest(0, p_total_raids) * 26 +
    floor(greatest(0, p_total_coins_earned)::numeric / 175)::integer +
    greatest(0, p_total_shards_earned) * 180;
$$;

create or replace function public.compute_vault_level(
  p_active_days integer,
  p_total_raids integer,
  p_total_coins_earned bigint,
  p_total_shards_earned integer
)
returns integer
language sql
immutable
as $$
  select least(
    15,
    greatest(
      1,
      floor(
        public.compute_vault_points(
          p_active_days,
          p_total_raids,
          p_total_coins_earned,
          p_total_shards_earned
        )::numeric / 180
      )::integer + 1
    )
  );
$$;

create or replace function public.compute_vault_coin_bonus_pct(
  p_level integer
)
returns integer
language sql
immutable
as $$
  select least(20, greatest(0, (greatest(1, p_level) - 1) * 2));
$$;

create or replace function public.start_raid_session(
  p_user_id uuid,
  p_cells jsonb
)
returns table (
  raid_id uuid,
  user_id uuid,
  consumed_keys integer
)
language plpgsql
as $$
declare
  v_user public.users%rowtype;
  v_existing_raid uuid;
  v_new_raid_id uuid;
  v_total_cells integer;
  v_bomb_cells integer;
  v_invalid_index_count integer;
  v_duplicate_index_count integer;
begin
  if jsonb_typeof(p_cells) <> 'array' then
    raise exception 'BAD_REQUEST:Invalid raid cell payload.';
  end if;

  select count(*),
         count(*) filter (where cell.cell_type = 'bomb'),
         count(*) filter (where cell.cell_index < 0 or cell.cell_index > 8),
         count(*) - count(distinct cell.cell_index)
    into v_total_cells, v_bomb_cells, v_invalid_index_count, v_duplicate_index_count
  from jsonb_to_recordset(p_cells) as cell(
    cell_index integer,
    cell_type text,
    value numeric,
    revealed boolean
  );

  if v_total_cells <> 9 then
    raise exception 'BAD_REQUEST:Raid must contain exactly 9 cells.';
  end if;

  if v_bomb_cells <> 1 then
    raise exception 'BAD_REQUEST:Raid must contain exactly 1 bomb.';
  end if;

  if v_invalid_index_count > 0 or v_duplicate_index_count > 0 then
    raise exception 'BAD_REQUEST:Raid cell indexes must be unique values from 0 to 8.';
  end if;

  select *
    into v_user
  from public.users as u
  where u.id = p_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND:User not found.';
  end if;

  select r.id
    into v_existing_raid
  from public.raids as r
  where r.user_id = p_user_id
    and r.status = 'active'
  limit 1
  for update;

  if v_existing_raid is not null then
    raise exception 'CONFLICT:Active raid already exists.';
  end if;

  if v_user.keys < 1 then
    raise exception 'BAD_REQUEST:You need at least 1 Key to start a raid.';
  end if;

  insert into public.raids (
    user_id,
    status,
    temporary_coins,
    temporary_shards,
    multiplier_factor,
    opened_cells_count
  )
  values (
    p_user_id,
    'active',
    0,
    0,
    1.00,
    0
  )
  returning id into v_new_raid_id;

  insert into public.raid_cells (
    raid_id,
    cell_index,
    cell_type,
    value,
    revealed
  )
  select
    v_new_raid_id,
    cell.cell_index,
    cell.cell_type,
    cell.value,
    false
  from jsonb_to_recordset(p_cells) as cell(
    cell_index integer,
    cell_type text,
    value numeric,
    revealed boolean
  );

  update public.users as u
  set keys = u.keys - 1,
      total_raids = u.total_raids + 1,
      vault_level = public.compute_vault_level(
        u.active_days,
        u.total_raids + 1,
        u.total_coins_earned,
        u.total_shards_earned
      )
  where u.id = p_user_id;

  insert into public.economy_logs (
    user_id,
    type,
    currency,
    amount,
    meta
  )
  values (
    p_user_id,
    'raid_start',
    'keys',
    -1,
    jsonb_build_object('raid_id', v_new_raid_id)
  );

  return query
  select v_new_raid_id, p_user_id, 1;
end;
$$;

create or replace function public.reveal_raid_cell_action(
  p_user_id uuid,
  p_raid_id uuid,
  p_cell_index integer,
  p_cooldown_ms integer default 650
)
returns table (
  raid_id uuid,
  raid_status text,
  hit_bomb boolean,
  reward_type text,
  reward_value bigint,
  reward_label text,
  credited_coins bigint,
  credited_shards integer,
  temporary_coins bigint,
  temporary_shards integer,
  multiplier_factor numeric,
  opened_cells_count integer,
  ended_at timestamptz
)
language plpgsql
as $$
declare
  v_raid public.raids%rowtype;
  v_cell public.raid_cells%rowtype;
  v_user public.users%rowtype;
  v_now timestamptz := timezone('utc', clock_timestamp());
  v_next_coins bigint;
  v_next_shards integer;
  v_next_multiplier numeric(6,2);
  v_opened_cells_count integer;
  v_reward_type text;
  v_reward_value bigint;
  v_reward_label text;
  v_credit_coins bigint := 0;
  v_credit_shards integer := 0;
  v_coin_bonus_pct integer := 0;
  v_bonus_coins bigint := 0;
begin
  if p_cell_index < 0 or p_cell_index > 8 then
    raise exception 'BAD_REQUEST:Invalid raid cell index.';
  end if;

  select *
    into v_raid
  from public.raids as r
  where r.id = p_raid_id
    and r.user_id = p_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND:Active raid not found.';
  end if;

  if v_raid.status <> 'active' then
    raise exception 'CONFLICT:Raid is not active.';
  end if;

  if v_raid.last_action_at is not null
     and v_raid.last_action_at + make_interval(secs => p_cooldown_ms::numeric / 1000) > v_now then
    raise exception 'RATE_LIMIT:Too many rapid taps. Slow down a little.';
  end if;

  select *
    into v_cell
  from public.raid_cells as rc
  where rc.raid_id = p_raid_id
    and rc.cell_index = p_cell_index
  for update;

  if not found then
    raise exception 'NOT_FOUND:Raid cell not found.';
  end if;

  if v_cell.revealed then
    raise exception 'CONFLICT:That cell has already been opened.';
  end if;

  update public.raid_cells as rc
  set revealed = true
  where rc.id = v_cell.id;

  if v_cell.cell_type = 'bomb' then
    update public.raids as r
    set status = 'lost',
        ended_at = v_now,
        last_action_at = v_now
    where r.id = p_raid_id;

    insert into public.economy_logs (
      user_id,
      type,
      currency,
      amount,
      meta
    )
    values (
      p_user_id,
      'raid_loss',
      'coins',
      0,
      jsonb_build_object(
        'raid_id', p_raid_id,
        'lost_coins', v_raid.temporary_coins,
        'lost_shards', v_raid.temporary_shards
      )
    );

    return query
    select
      p_raid_id,
      'lost',
      true,
      'coins',
      0::bigint,
      'Bomb',
      0::bigint,
      0::integer,
      v_raid.temporary_coins,
      v_raid.temporary_shards,
      v_raid.multiplier_factor,
      v_raid.opened_cells_count,
      v_now;
    return;
  end if;

  v_next_coins := v_raid.temporary_coins;
  v_next_shards := v_raid.temporary_shards;
  v_next_multiplier := v_raid.multiplier_factor;

  if v_cell.cell_type = 'coin' then
    v_next_coins := v_next_coins + round(v_cell.value)::bigint;
    v_reward_type := 'coins';
    v_reward_value := round(v_cell.value)::bigint;
    v_reward_label := '+' || round(v_cell.value)::bigint || ' coins';
  elsif v_cell.cell_type = 'multiplier' then
    v_next_multiplier := round((v_raid.multiplier_factor * v_cell.value)::numeric, 2);
    v_next_coins := greatest(
      round(v_raid.temporary_coins * v_cell.value)::bigint,
      round(v_raid.temporary_coins + (v_cell.value * 95))::bigint
    );
    v_reward_type := 'coins';
    v_reward_value := greatest(v_next_coins - v_raid.temporary_coins, 0);
    v_reward_label := 'x' || trim(to_char(v_cell.value, 'FM999990.00'));
  elsif v_cell.cell_type = 'shard' then
    v_next_shards := v_next_shards + round(v_cell.value)::integer;
    v_reward_type := 'shards';
    v_reward_value := round(v_cell.value)::bigint;
    v_reward_label := '+' || round(v_cell.value)::bigint || ' shard';
  else
    raise exception 'BAD_REQUEST:Unsupported raid cell type.';
  end if;

  v_opened_cells_count := v_raid.opened_cells_count + 1;

  if v_opened_cells_count >= 8 then
    update public.raids as r
    set status = 'won',
        temporary_coins = v_next_coins,
        temporary_shards = v_next_shards,
        multiplier_factor = v_next_multiplier,
        opened_cells_count = v_opened_cells_count,
        last_action_at = v_now,
        ended_at = v_now
    where r.id = p_raid_id;

    select *
      into v_user
    from public.users as u
    where u.id = p_user_id
    for update;

    if not found then
      raise exception 'NOT_FOUND:User not found.';
    end if;

    v_coin_bonus_pct := public.compute_vault_coin_bonus_pct(
      public.compute_vault_level(
        v_user.active_days,
        v_user.total_raids,
        v_user.total_coins_earned,
        v_user.total_shards_earned
      )
    );
    v_bonus_coins := floor((v_next_coins * v_coin_bonus_pct)::numeric / 100)::bigint;
    v_credit_coins := v_next_coins + v_bonus_coins;
    v_credit_shards := v_next_shards;

    update public.users as u
    set coins = u.coins + v_credit_coins,
        shards = u.shards + v_credit_shards,
        total_coins_earned = u.total_coins_earned + v_credit_coins,
        total_shards_earned = u.total_shards_earned + v_credit_shards,
        vault_level = public.compute_vault_level(
          u.active_days,
          u.total_raids,
          u.total_coins_earned + v_credit_coins,
          u.total_shards_earned + v_credit_shards
        )
    where u.id = p_user_id;

    if v_credit_coins > 0 then
      insert into public.economy_logs (
        user_id,
        type,
        currency,
        amount,
        meta
      )
      values (
        p_user_id,
        'raid_win',
        'coins',
        v_credit_coins,
        jsonb_build_object(
          'raid_id', p_raid_id,
          'source', 'raid_auto_win',
          'base_coins', v_next_coins,
          'bonus_coins', v_bonus_coins,
          'bonus_pct', v_coin_bonus_pct
        )
      );
    end if;

    if v_credit_shards > 0 then
      insert into public.economy_logs (
        user_id,
        type,
        currency,
        amount,
        meta
      )
      values (
        p_user_id,
        'raid_win',
        'shards',
        v_credit_shards,
        jsonb_build_object(
          'raid_id', p_raid_id,
          'source', 'raid_auto_win'
        )
      );
    end if;

    return query
    select
      p_raid_id,
      'won',
      false,
      v_reward_type,
      v_reward_value,
      v_reward_label,
      v_credit_coins,
      v_credit_shards,
      v_next_coins,
      v_next_shards,
      v_next_multiplier,
      v_opened_cells_count,
      v_now;
    return;
  end if;

  update public.raids as r
  set status = 'active',
      temporary_coins = v_next_coins,
      temporary_shards = v_next_shards,
      multiplier_factor = v_next_multiplier,
      opened_cells_count = v_opened_cells_count,
      last_action_at = v_now
  where r.id = p_raid_id;

  return query
  select
    p_raid_id,
    'active',
    false,
    v_reward_type,
    v_reward_value,
    v_reward_label,
    0::bigint,
    0::integer,
    v_next_coins,
    v_next_shards,
    v_next_multiplier,
    v_opened_cells_count,
    null::timestamptz;
end;
$$;

create or replace function public.cash_out_raid_action(
  p_user_id uuid,
  p_raid_id uuid,
  p_cooldown_ms integer default 650
)
returns table (
  raid_id uuid,
  raid_status text,
  credited_coins bigint,
  credited_shards integer,
  ended_at timestamptz
)
language plpgsql
as $$
declare
  v_raid public.raids%rowtype;
  v_user public.users%rowtype;
  v_now timestamptz := timezone('utc', clock_timestamp());
  v_coin_bonus_pct integer := 0;
  v_bonus_coins bigint := 0;
  v_credit_coins bigint := 0;
begin
  select *
    into v_raid
  from public.raids as r
  where r.id = p_raid_id
    and r.user_id = p_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND:Active raid not found.';
  end if;

  if v_raid.status <> 'active' then
    raise exception 'CONFLICT:Raid is not active.';
  end if;

  if v_raid.opened_cells_count < 1 then
    raise exception 'BAD_REQUEST:Open at least one safe cell before cashing out.';
  end if;

  if v_raid.last_action_at is not null
     and v_raid.last_action_at + make_interval(secs => p_cooldown_ms::numeric / 1000) > v_now then
    raise exception 'RATE_LIMIT:Too many rapid taps. Wait a moment before cashing out.';
  end if;

  select *
    into v_user
  from public.users as u
  where u.id = p_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND:User not found.';
  end if;

  v_coin_bonus_pct := public.compute_vault_coin_bonus_pct(
    public.compute_vault_level(
      v_user.active_days,
      v_user.total_raids,
      v_user.total_coins_earned,
      v_user.total_shards_earned
    )
  );
  v_bonus_coins := floor((v_raid.temporary_coins * v_coin_bonus_pct)::numeric / 100)::bigint;
  v_credit_coins := v_raid.temporary_coins + v_bonus_coins;

  update public.raids as r
  set status = 'cashed_out',
      ended_at = v_now,
      last_action_at = v_now
  where r.id = p_raid_id;

  update public.users as u
  set coins = u.coins + v_credit_coins,
      shards = u.shards + v_raid.temporary_shards,
      total_coins_earned = u.total_coins_earned + v_credit_coins,
      total_shards_earned = u.total_shards_earned + v_raid.temporary_shards,
      vault_level = public.compute_vault_level(
        u.active_days,
        u.total_raids,
        u.total_coins_earned + v_credit_coins,
        u.total_shards_earned + v_raid.temporary_shards
      )
  where u.id = p_user_id;

  if v_credit_coins > 0 then
    insert into public.economy_logs (
      user_id,
      type,
      currency,
      amount,
      meta
    )
    values (
      p_user_id,
      'raid_win',
      'coins',
      v_credit_coins,
      jsonb_build_object(
        'raid_id', p_raid_id,
        'base_coins', v_raid.temporary_coins,
        'bonus_coins', v_bonus_coins,
        'bonus_pct', v_coin_bonus_pct
      )
    );
  end if;

  if v_raid.temporary_shards > 0 then
    insert into public.economy_logs (
      user_id,
      type,
      currency,
      amount,
      meta
    )
    values (
      p_user_id,
      'raid_win',
      'shards',
      v_raid.temporary_shards,
      jsonb_build_object('raid_id', p_raid_id)
    );
  end if;

  return query
  select
    p_raid_id,
    'cashed_out',
    v_credit_coins,
    v_raid.temporary_shards,
    v_now;
end;
$$;

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
  from public.users as u
  where u.id = p_user_id
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
  from public.daily_claims as dc
  where dc.user_id = p_user_id;

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

  update public.users as u
  set keys = u.keys + case when v_reward_type = 'keys' then v_reward_value::integer else 0 end,
      coins = u.coins + case when v_reward_type = 'coins' then v_reward_value else 0 end,
      shards = u.shards + case when v_reward_type = 'shards' then v_reward_value::integer else 0 end,
      active_days = u.active_days + 1,
      vault_level = public.compute_vault_level(
        u.active_days + 1,
        u.total_raids,
        u.total_coins_earned,
        u.total_shards_earned
      ),
      last_daily_claim_at = v_now
  where u.id = p_user_id;

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
