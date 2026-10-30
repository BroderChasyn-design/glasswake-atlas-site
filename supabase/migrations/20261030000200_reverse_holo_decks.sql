-- Distinct reverse-holo finish for online cards and support for playing from
-- the signed-in account binder. Existing foils and trades remain unchanged.

alter table public.player_inventory
  add column if not exists reverse_holo boolean not null default false;
alter table public.trade_offer_items
  add column if not exists reverse_holo boolean not null default false;

alter table public.player_inventory drop constraint if exists player_inventory_pkey;
alter table public.player_inventory add constraint player_inventory_pkey
  primary key (user_id,card_id,rarity,foil,reverse_holo);
alter table public.player_inventory drop constraint if exists player_inventory_finish_exclusive;
alter table public.player_inventory add constraint player_inventory_finish_exclusive
  check (not (foil and reverse_holo));

alter table public.trade_offer_items drop constraint if exists trade_offer_items_pkey;
alter table public.trade_offer_items add constraint trade_offer_items_pkey
  primary key (offer_id,side,card_id,rarity,foil,reverse_holo);
alter table public.trade_offer_items drop constraint if exists trade_offer_items_finish_exclusive;
alter table public.trade_offer_items add constraint trade_offer_items_finish_exclusive
  check (not (foil and reverse_holo));

alter table public.card_catalog
  add column if not exists is_promo_only boolean not null default false;
alter table public.card_catalog drop constraint if exists card_catalog_card_kind_check;
alter table public.card_catalog add constraint card_catalog_card_kind_check
  check (card_kind in ('base','figure','vista','special'));
alter table public.card_catalog drop constraint if exists card_catalog_tradition_key_check;
alter table public.card_catalog add constraint card_catalog_tradition_key_check
  check (tradition_key in ('hindu','buddhist','christian','islamic','jewish','sikh','shinto','yoruba','satire'));
insert into public.card_catalog(card_id,card_kind,tradition_key,is_scenic,is_signature,pull_weight,is_promo_only)
values('noodly_navigator','special','satire',false,false,1,true)
on conflict(card_id) do update set is_promo_only=true;

-- This unique-supply ledger and deferred triggers make the promo card a true
-- single copy, including while it is held in a pending trade offer.
create table if not exists private.unique_card_supply(
  card_id text primary key references public.card_catalog(card_id) on delete cascade,
  max_supply integer not null check(max_supply>0)
);
insert into private.unique_card_supply(card_id,max_supply) values('noodly_navigator',1)
on conflict(card_id) do update set max_supply=1;
create table if not exists private.founder_collection_grants(
  user_id uuid not null references auth.users(id) on delete cascade,
  grant_key text not null,
  granted_at timestamptz not null default now(),
  primary key(user_id,grant_key)
);
revoke all on private.unique_card_supply,private.founder_collection_grants from public,anon,authenticated;

create or replace function private.enforce_unique_card_supply(p_card_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_limit integer;v_total bigint;
begin
  select max_supply into v_limit from private.unique_card_supply where card_id=p_card_id for update;
  if not found then return; end if;
  select
    (select coalesce(sum(i.quantity),0) from public.player_inventory i where i.card_id=p_card_id)
    +
    (select coalesce(sum(i.quantity),0) from public.trade_offer_items i
      join public.trade_offers o on o.id=i.offer_id
      where i.card_id=p_card_id and o.status='pending')
  into v_total;
  if v_total>v_limit then raise exception 'Unique card supply exceeded for %.',p_card_id; end if;
end;
$$;

create or replace function private.check_inventory_unique_supply()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.enforce_unique_card_supply(coalesce(new.card_id,old.card_id));
  return null;
end;
$$;

create or replace function private.check_offer_unique_supply()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_item record;v_offer_id uuid:=coalesce(new.id,old.id);
begin
  for v_item in select distinct card_id from public.trade_offer_items where offer_id=v_offer_id loop
    perform private.enforce_unique_card_supply(v_item.card_id);
  end loop;
  return null;
end;
$$;

drop trigger if exists player_inventory_unique_supply on public.player_inventory;
create constraint trigger player_inventory_unique_supply after insert or update or delete
  on public.player_inventory deferrable initially deferred for each row
  execute function private.check_inventory_unique_supply();
drop trigger if exists trade_offer_items_unique_supply on public.trade_offer_items;
create constraint trigger trade_offer_items_unique_supply after insert or update or delete
  on public.trade_offer_items deferrable initially deferred for each row
  execute function private.check_inventory_unique_supply();
drop trigger if exists trade_offers_unique_supply on public.trade_offers;
create constraint trigger trade_offers_unique_supply after insert or update
  on public.trade_offers deferrable initially deferred for each row
  execute function private.check_offer_unique_supply();
revoke all on function private.enforce_unique_card_supply(text) from public,anon,authenticated;
revoke all on function private.check_inventory_unique_supply() from public,anon,authenticated;
revoke all on function private.check_offer_unique_supply() from public,anon,authenticated;

create or replace function public.open_online_pack()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid:=auth.uid();v_marks integer;v_card public.card_catalog%rowtype;
  v_drawn text[]:=array[]::text[];v_result jsonb:='[]'::jsonb;v_rarity text;v_foil boolean;v_roll double precision;
begin
  if v_user is null then raise exception 'Sign in first.'; end if;
  if not private.mfa_aal2_or_not_enrolled() then raise exception 'Verify your authenticator before opening a pack.'; end if;
  select marks into v_marks from public.player_wallets where user_id=v_user for update;
  if not found then raise exception 'Player wallet is missing.'; end if;
  if v_marks<100 then raise exception 'You need 100 online marks for a pack.'; end if;
  update public.player_wallets set marks=marks-100 where user_id=v_user;
  for i in 1..5 loop
    select c.* into v_card from public.card_catalog c
      where not c.is_promo_only and not (c.card_id=any(v_drawn))
      order by -ln(greatest(random(),0.0000001))/c.pull_weight limit 1;
    if not found then exit; end if;
    v_roll:=random()*100;
    v_rarity:=case when v_roll<60 then 'common' when v_roll<85 then 'expensive' when v_roll<97 then 'extravagant' else 'exquisite' end;
    v_foil:=not v_card.is_scenic and random()<case when v_card.is_signature then 0.005 else 0.02 end;
    perform public.adjust_player_inventory(v_user,v_card.card_id,v_rarity,v_foil,1);
    v_drawn:=array_append(v_drawn,v_card.card_id);
    v_result:=v_result||jsonb_build_array(jsonb_build_object('card_id',v_card.card_id,'rarity',v_rarity,'foil',v_foil,'reverse_holo',false));
  end loop;
  return v_result;
end;
$$;

create or replace function public.adjust_player_inventory(
  p_user uuid,p_card_id text,p_rarity text,p_foil boolean,p_reverse_holo boolean,p_delta integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_quantity integer;
begin
  if coalesce(p_foil,false) and coalesce(p_reverse_holo,false) then
    raise exception 'A card cannot be both foil and reverse holographic.';
  end if;
  if p_delta=0 then return; end if;
  if p_delta>0 then
    insert into public.player_inventory(user_id,card_id,rarity,foil,reverse_holo,quantity)
    values(p_user,p_card_id,p_rarity,coalesce(p_foil,false),coalesce(p_reverse_holo,false),p_delta)
    on conflict(user_id,card_id,rarity,foil,reverse_holo)
    do update set quantity=public.player_inventory.quantity+excluded.quantity;
  else
    update public.player_inventory set quantity=quantity+p_delta
      where user_id=p_user and card_id=p_card_id and rarity=p_rarity
        and foil=coalesce(p_foil,false) and reverse_holo=coalesce(p_reverse_holo,false)
        and quantity+p_delta>=0
      returning quantity into v_quantity;
    if not found then raise exception 'The required card copy is no longer available.'; end if;
    if v_quantity=0 then
      delete from public.player_inventory where user_id=p_user and card_id=p_card_id
        and rarity=p_rarity and foil=coalesce(p_foil,false)
        and reverse_holo=coalesce(p_reverse_holo,false);
    end if;
  end if;
end;
$$;

-- Keep existing pack-opening calls on the standard/foil path.
create or replace function public.adjust_player_inventory(
  p_user uuid,p_card_id text,p_rarity text,p_foil boolean,p_delta integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.adjust_player_inventory(p_user,p_card_id,p_rarity,p_foil,false,p_delta);
end;
$$;

revoke all on function public.adjust_player_inventory(uuid,text,text,boolean,boolean,integer) from public,anon,authenticated;

create or replace function public.create_trade_offer(
  p_recipient_username text,p_offered_items jsonb,p_requested_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_sender uuid:=auth.uid();v_recipient uuid;v_offer uuid;v_item record;v_have integer;v_scenic boolean;
begin
  if v_sender is null then raise exception 'Sign in first.'; end if;
  if not private.mfa_aal2_or_not_enrolled() then raise exception 'Verify your authenticator before creating a trade.'; end if;
  if jsonb_typeof(p_offered_items)<>'array' or jsonb_typeof(p_requested_items)<>'array'
     or jsonb_array_length(p_offered_items) not between 1 and 50
     or jsonb_array_length(p_requested_items) not between 1 and 50 then
    raise exception 'Add 1–50 card lines on both sides of the offer.';
  end if;
  select user_id into v_recipient from public.player_profiles where username=lower(trim(p_recipient_username));
  if v_recipient is null then raise exception 'Player not found.'; end if;
  if v_recipient=v_sender then raise exception 'You cannot trade with yourself.'; end if;
  perform 1 from public.player_profiles where user_id=v_sender for update;
  if (select count(*) from public.trade_offers where sender_user_id=v_sender and status='pending')>=10 then
    raise exception 'Resolve or cancel a pending offer before sending another.';
  end if;
  insert into public.trade_offers(sender_user_id,recipient_user_id)
    values(v_sender,v_recipient) returning id into v_offer;
  for v_item in
    select side,card_id,rarity,foil,reverse_holo,sum(quantity)::integer as quantity
    from (
      select 'offered'::text as side,x.* from jsonb_to_recordset(p_offered_items)
        as x(card_id text,rarity text,foil boolean,reverse_holo boolean,quantity integer)
      union all
      select 'requested',x.* from jsonb_to_recordset(p_requested_items)
        as x(card_id text,rarity text,foil boolean,reverse_holo boolean,quantity integer)
    ) s group by side,card_id,rarity,foil,reverse_holo
  loop
    if v_item.card_id is null
      or v_item.rarity not in ('common','expensive','extravagant','exquisite')
      or v_item.quantity not between 1 and 10000 then
      raise exception 'Invalid card, rarity, or quantity in trade.';
    end if;
    if coalesce(v_item.foil,false) and coalesce(v_item.reverse_holo,false) then
      raise exception 'A card cannot be both foil and reverse holographic.';
    end if;
    select is_scenic into v_scenic from public.card_catalog where card_id=v_item.card_id;
    if not found then raise exception 'Unknown card in trade.'; end if;
    if v_scenic and (coalesce(v_item.foil,false) or coalesce(v_item.reverse_holo,false)) then
      raise exception 'Scenic cards do not have holographic prints.';
    end if;
    insert into public.trade_offer_items(offer_id,side,card_id,rarity,foil,reverse_holo,quantity)
      values(v_offer,v_item.side,v_item.card_id,v_item.rarity,coalesce(v_item.foil,false),coalesce(v_item.reverse_holo,false),v_item.quantity);
    if v_item.side='offered' then
      select quantity into v_have from public.player_inventory
        where user_id=v_sender and card_id=v_item.card_id and rarity=v_item.rarity
          and foil=coalesce(v_item.foil,false) and reverse_holo=coalesce(v_item.reverse_holo,false)
        for update;
      if not found or v_have<v_item.quantity then raise exception 'You do not have enough copies of an offered card.'; end if;
      perform public.adjust_player_inventory(v_sender,v_item.card_id,v_item.rarity,
        coalesce(v_item.foil,false),coalesce(v_item.reverse_holo,false),-v_item.quantity);
    end if;
  end loop;
  return v_offer;
end;
$$;

create or replace function public.resolve_trade_offer(p_offer_id uuid,p_action text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_user uuid:=auth.uid();v_offer public.trade_offers%rowtype;v_item record;v_have integer;
begin
  if v_user is null then raise exception 'Sign in first.'; end if;
  if not private.mfa_aal2_or_not_enrolled() then raise exception 'Verify your authenticator before resolving a trade.'; end if;
  if p_action not in ('accept','decline','cancel') then raise exception 'Unknown trade action.'; end if;
  select * into v_offer from public.trade_offers where id=p_offer_id for update;
  if not found then raise exception 'Trade offer not found.'; end if;
  if v_offer.status<>'pending' then raise exception 'This offer is no longer pending.'; end if;
  if v_offer.sender_user_id<>v_user and v_offer.recipient_user_id<>v_user then raise exception 'You are not part of this offer.'; end if;
  if v_offer.expires_at<=now() then
    for v_item in select * from public.trade_offer_items where offer_id=v_offer.id and side='offered' loop
      perform public.adjust_player_inventory(v_offer.sender_user_id,v_item.card_id,v_item.rarity,
        v_item.foil,v_item.reverse_holo,v_item.quantity);
    end loop;
    update public.trade_offers set status='expired' where id=v_offer.id;
    return 'expired';
  end if;
  if p_action='cancel' then
    if v_offer.sender_user_id<>v_user then raise exception 'Only the sender can cancel this offer.'; end if;
  elsif v_offer.recipient_user_id<>v_user then
    raise exception 'Only the recipient can accept or decline this offer.';
  end if;
  if p_action='accept' then
    for v_item in select * from public.trade_offer_items where offer_id=v_offer.id and side='requested' order by card_id,rarity,foil,reverse_holo loop
      select quantity into v_have from public.player_inventory where user_id=v_offer.recipient_user_id
        and card_id=v_item.card_id and rarity=v_item.rarity and foil=v_item.foil
        and reverse_holo=v_item.reverse_holo for update;
      if not found or v_have<v_item.quantity then raise exception 'The recipient no longer has enough copies of a requested card.'; end if;
      perform public.adjust_player_inventory(v_offer.recipient_user_id,v_item.card_id,v_item.rarity,
        v_item.foil,v_item.reverse_holo,-v_item.quantity);
    end loop;
    for v_item in select * from public.trade_offer_items where offer_id=v_offer.id and side='requested' loop
      perform public.adjust_player_inventory(v_offer.sender_user_id,v_item.card_id,v_item.rarity,
        v_item.foil,v_item.reverse_holo,v_item.quantity);
    end loop;
    for v_item in select * from public.trade_offer_items where offer_id=v_offer.id and side='offered' loop
      perform public.adjust_player_inventory(v_offer.recipient_user_id,v_item.card_id,v_item.rarity,
        v_item.foil,v_item.reverse_holo,v_item.quantity);
    end loop;
    update public.trade_offers set status='accepted' where id=v_offer.id;
    return 'accepted';
  end if;
  for v_item in select * from public.trade_offer_items where offer_id=v_offer.id and side='offered' loop
    perform public.adjust_player_inventory(v_offer.sender_user_id,v_item.card_id,v_item.rarity,
      v_item.foil,v_item.reverse_holo,v_item.quantity);
  end loop;
  update public.trade_offers set status=case when p_action='cancel' then 'cancelled' else 'declined' end where id=v_offer.id;
  return case when p_action='cancel' then 'cancelled' else 'declined' end;
end;
$$;

revoke all on function public.create_trade_offer(text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.resolve_trade_offer(uuid,text) from public,anon,authenticated;
grant execute on function public.create_trade_offer(text,jsonb,jsonb) to authenticated;
grant execute on function public.resolve_trade_offer(uuid,text) to authenticated;
