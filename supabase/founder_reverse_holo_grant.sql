-- Run this once in the Supabase SQL Editor after:
-- 1. Creating your Glasswake account, and
-- 2. Applying 20261030000200_reverse_holo_decks.sql.
-- The migration grants this automatically on signup. This is a SQL Editor-only
-- recovery script for an account that existed before that migration was run.
-- No public RPC lets other players claim the reward.

do $founder$
declare
  v_user_id uuid;
  v_username text := lower('broderchasyn');
  v_new_grant uuid;
begin
  select user_id into v_user_id
  from public.player_profiles
  where username=v_username;

  if v_user_id is null then
    raise exception 'No Glasswake account found for username %. Create that account first and use its exact username.',v_username;
  end if;

  insert into private.founder_collection_grants(user_id,grant_key)
  values(v_user_id,'founder-reverse-holo-and-noodly-card-v1')
  on conflict do nothing
  returning user_id into v_new_grant;
  if v_new_grant is not null then
    insert into public.player_inventory(user_id,card_id,rarity,foil,reverse_holo,quantity)
    select v_user_id,c.card_id,'common',false,true,1
    from public.card_catalog c
    where not c.is_scenic and not c.is_promo_only
    on conflict(user_id,card_id,rarity,foil,reverse_holo)
    do nothing;

    insert into public.player_inventory(user_id,card_id,rarity,foil,reverse_holo,quantity)
    values(v_user_id,'noodly_navigator','exquisite',false,false,1)
    on conflict(user_id,card_id,rarity,foil,reverse_holo) do nothing;
  else
    raise notice 'The founder collection was already granted to this account.';
  end if;
end;
$founder$;
