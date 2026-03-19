create or replace function public.apply_referral_bonus_on_signup(
  p_invitee_user_id uuid,
  p_inviter_code text
)
returns table (
  applied boolean,
  inviter_user_id uuid
)
language plpgsql
as $$
declare
  v_inviter public.users%rowtype;
  v_invitee public.users%rowtype;
  v_inserted_referral_id uuid;
begin
  if p_inviter_code is null or length(trim(p_inviter_code)) = 0 then
    return query select false, null::uuid;
    return;
  end if;

  select *
    into v_invitee
  from public.users
  where id = p_invitee_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND:Invitee user not found.';
  end if;

  if v_invitee.referred_by is not null then
    return query select false, v_invitee.referred_by;
    return;
  end if;

  select *
    into v_inviter
  from public.users
  where referral_code = upper(regexp_replace(p_inviter_code, '[^a-zA-Z0-9]', '', 'g'))
  for update;

  if not found then
    return query select false, null::uuid;
    return;
  end if;

  if v_inviter.id = p_invitee_user_id then
    return query select false, null::uuid;
    return;
  end if;

  insert into public.referrals (
    inviter_user_id,
    invited_user_id
  )
  values (
    v_inviter.id,
    p_invitee_user_id
  )
  on conflict (invited_user_id) do nothing
  returning id into v_inserted_referral_id;

  if v_inserted_referral_id is null then
    return query select false, v_inviter.id;
    return;
  end if;

  update public.users
  set keys = keys + 2
  where id = v_inviter.id;

  update public.users
  set keys = keys + 1,
      referred_by = v_inviter.id
  where id = p_invitee_user_id;

  insert into public.economy_logs (
    user_id,
    type,
    currency,
    amount,
    meta
  )
  values
    (
      v_inviter.id,
      'referral_bonus',
      'keys',
      2,
      jsonb_build_object(
        'invited_user_id', p_invitee_user_id,
        'role', 'inviter'
      )
    ),
    (
      p_invitee_user_id,
      'referral_bonus',
      'keys',
      1,
      jsonb_build_object(
        'inviter_user_id', v_inviter.id,
        'role', 'invitee'
      )
    );

  return query select true, v_inviter.id;
end;
$$;

comment on function public.apply_referral_bonus_on_signup(uuid, text) is
  'Atomically applies inviter and invitee key bonuses for a first-time referral signup.';
