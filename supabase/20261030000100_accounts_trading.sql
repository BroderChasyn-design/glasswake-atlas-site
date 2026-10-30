-- Glasswake Atlas account and player-to-player card trade backend.
-- Apply this migration to a new Supabase project before enabling accounts.

create extension if not exists pgcrypto;

create table if not exists public.card_catalog (
  card_id text primary key,
  card_kind text not null check (card_kind in ('base','figure','vista')),
  tradition_key text not null check (tradition_key in ('hindu','buddhist','christian','islamic','jewish','sikh','shinto','yoruba')),
  is_scenic boolean not null default false,
  is_signature boolean not null default false,
  pull_weight numeric not null check (pull_weight > 0)
);

with traditions as (
  select array['hindu','buddhist','christian','islamic','jewish','sikh','shinto','yoruba']::text[] as keys
), all_cards as (
  select 'card_' || lpad(n::text,3,'0') as card_id, 'base'::text as card_kind, (n-1)%8 as tradition_index, false as is_scenic, false as is_signature from generate_series(1,44) as g(n)
  union all
  select 'figure_' || lpad(n::text,3,'0'), 'figure', (n-1)%8, false, n in (124,287) from generate_series(1,352) as g(n)
  union all
  select 'vista_' || lpad(n::text,2,'0'), 'vista', (n-1)%8, true, false from generate_series(1,24) as g(n)
)
insert into public.card_catalog(card_id,card_kind,tradition_key,is_scenic,is_signature,pull_weight)
select c.card_id,c.card_kind,t.keys[c.tradition_index+1],c.is_scenic,c.is_signature,
       case when t.keys[c.tradition_index+1]='islamic' then 0.5 else 1.0 end
from all_cards c cross join traditions t
on conflict (card_id) do nothing;

create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) between 1 and 32),
  avatar_id text not null default 'star' check (avatar_id in ('star','wave','compass','sun','leaf','moon','shell','anchor')),
  created_at timestamptz not null default now()
);

create table if not exists public.player_wallets (
  user_id uuid primary key references public.player_profiles(user_id) on delete cascade,
  marks integer not null default 500 check (marks >= 0)
);

create table if not exists public.player_inventory (
  user_id uuid not null references public.player_profiles(user_id) on delete cascade,
  card_id text not null references public.card_catalog(card_id),
  rarity text not null check (rarity in ('common','expensive','extravagant','exquisite')),
  foil boolean not null default false,
  quantity integer not null check (quantity > 0 and quantity <= 10000),
  primary key(user_id,card_id,rarity,foil)
);

create table if not exists public.trade_offers (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references public.player_profiles(user_id) on delete cascade,
  recipient_user_id uuid not null references public.player_profiles(user_id) on delete cascade,
  offered_card_id text not null references public.card_catalog(card_id),
  offered_rarity text not null check (offered_rarity in ('common','expensive','extravagant','exquisite')),
  offered_foil boolean not null default false,
  requested_card_id text not null references public.card_catalog(card_id),
  requested_rarity text not null check (requested_rarity in ('common','expensive','extravagant','exquisite')),
  requested_foil boolean not null default false,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '14 days'),
  check (sender_user_id <> recipient_user_id)
);

-- Bundle items permit any number of cards on either side of a trade.
alter table public.trade_offers alter column offered_card_id drop not null;
alter table public.trade_offers alter column offered_rarity drop not null;
alter table public.trade_offers alter column requested_card_id drop not null;
alter table public.trade_offers alter column requested_rarity drop not null;
create table if not exists public.trade_offer_items (
  offer_id uuid not null references public.trade_offers(id) on delete cascade,
  side text not null check (side in ('offered','requested')),
  card_id text not null references public.card_catalog(card_id),
  rarity text not null check (rarity in ('common','expensive','extravagant','exquisite')),
  foil boolean not null default false,
  quantity integer not null check (quantity between 1 and 10000),
  primary key (offer_id,side,card_id,rarity,foil)
);
create index if not exists trade_offer_items_offer_idx on public.trade_offer_items(offer_id,side);

create index if not exists trade_offers_sender_idx on public.trade_offers(sender_user_id,status,created_at desc);
create index if not exists trade_offers_recipient_idx on public.trade_offers(recipient_user_id,status,created_at desc);
create index if not exists player_inventory_user_idx on public.player_inventory(user_id,card_id);

alter table public.card_catalog enable row level security;
alter table public.player_profiles enable row level security;
alter table public.player_wallets enable row level security;
alter table public.player_inventory enable row level security;
alter table public.trade_offers enable row level security;
alter table public.trade_offer_items enable row level security;

revoke all on public.card_catalog,public.player_profiles,public.player_wallets,public.player_inventory,public.trade_offers,public.trade_offer_items from anon,authenticated;
grant select on public.player_profiles to authenticated;
grant select on public.player_wallets,public.player_inventory,public.trade_offers to authenticated;
grant select on public.trade_offer_items to authenticated;

drop policy if exists "Players can read their own profile" on public.player_profiles;
create policy "Players can read their own profile" on public.player_profiles for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Players can read their own wallet" on public.player_wallets;
create policy "Players can read their own wallet" on public.player_wallets for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Players can read their own inventory" on public.player_inventory;
create policy "Players can read their own inventory" on public.player_inventory for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Trade participants can read offers" on public.trade_offers;
create policy "Trade participants can read offers" on public.trade_offers for select to authenticated using ((select auth.uid())=sender_user_id or (select auth.uid())=recipient_user_id);
drop policy if exists "Trade participants can read bundle items" on public.trade_offer_items;
create policy "Trade participants can read bundle items" on public.trade_offer_items for select to authenticated using (exists(select 1 from public.trade_offers o where o.id=offer_id and ((select auth.uid())=o.sender_user_id or (select auth.uid())=o.recipient_user_id)));

-- MFA is optional. Once a player verifies an authenticator, their inventory,
-- wallet and trade data require an AAL2 session at the database boundary.
create schema if not exists private;
revoke all on schema private from public,anon;
grant usage on schema private to authenticated;
create or replace function private.mfa_aal2_or_not_enrolled()
returns boolean language sql stable security definer set search_path = '' as $$
  select not exists(select 1 from auth.mfa_factors f where f.user_id=(select auth.uid()) and f.status='verified')
      or coalesce((select auth.jwt()->>'aal'),'aal1')='aal2'
$$;
revoke all on function private.mfa_aal2_or_not_enrolled() from public,anon;
grant execute on function private.mfa_aal2_or_not_enrolled() to authenticated;
drop policy if exists "MFA required for wallet" on public.player_wallets;
create policy "MFA required for wallet" on public.player_wallets as restrictive for select to authenticated using ((select private.mfa_aal2_or_not_enrolled()));
drop policy if exists "MFA required for inventory" on public.player_inventory;
create policy "MFA required for inventory" on public.player_inventory as restrictive for select to authenticated using ((select private.mfa_aal2_or_not_enrolled()));
drop policy if exists "MFA required for offers" on public.trade_offers;
create policy "MFA required for offers" on public.trade_offers as restrictive for select to authenticated using ((select private.mfa_aal2_or_not_enrolled()));
drop policy if exists "MFA required for offer items" on public.trade_offer_items;
create policy "MFA required for offer items" on public.trade_offer_items as restrictive for select to authenticated using ((select private.mfa_aal2_or_not_enrolled()));

create or replace function public.handle_new_player()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := lower(coalesce(new.raw_user_meta_data->>'username',''));
  v_display text := trim(coalesce(new.raw_user_meta_data->>'display_name',''));
  v_avatar text := coalesce(new.raw_user_meta_data->>'avatar_id','star');
begin
  if v_username !~ '^[a-z0-9_]{3,20}$' then
    v_username := 'player_' || left(replace(new.id::text,'-',''),10);
  end if;
  if char_length(v_display)<1 then v_display := v_username; end if;
  if v_avatar not in ('star','wave','compass','sun','leaf','moon','shell','anchor') then v_avatar := 'star'; end if;
  insert into public.player_profiles(user_id,username,display_name,avatar_id)
  values(new.id,v_username,left(v_display,32),v_avatar);
  insert into public.player_wallets(user_id,marks) values(new.id,500);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_glasswake on auth.users;
create trigger on_auth_user_created_glasswake after insert on auth.users for each row execute function public.handle_new_player();

create or replace function public.update_player_profile(p_username text,p_display_name text,p_avatar_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if not private.mfa_aal2_or_not_enrolled() then raise exception 'Verify your authenticator before changing your account.'; end if;
  if lower(trim(coalesce(p_username,''))) !~ '^[a-z0-9_]{3,20}$' then raise exception 'Username must be 3–20 letters, numbers, or underscores.'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 1 and 32 then raise exception 'Display name must be 1–32 characters.'; end if;
  if p_avatar_id not in ('star','wave','compass','sun','leaf','moon','shell','anchor') then raise exception 'Choose a supported avatar.'; end if;
  update public.player_profiles set username=lower(trim(p_username)),display_name=trim(p_display_name),avatar_id=p_avatar_id where user_id=auth.uid();
end;
$$;

create or replace function public.find_player(p_username text)
returns table(user_id uuid,username text,display_name text,avatar_id text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if not private.mfa_aal2_or_not_enrolled() then raise exception 'Verify your authenticator before accessing your collection.'; end if;
  if char_length(trim(coalesce(p_username,''))) not between 3 and 20 then raise exception 'Enter a complete username.'; end if;
  return query select p.user_id,p.username,p.display_name,p.avatar_id from public.player_profiles p
    where p.username=lower(trim(p_username)) and p.user_id<>auth.uid() limit 1;
end;
$$;

create or replace function public.get_public_profiles(p_user_ids uuid[])
returns table(user_id uuid,username text,display_name text,avatar_id text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if coalesce(array_length(p_user_ids,1),0)>30 then raise exception 'Too many profiles requested.'; end if;
  return query select p.user_id,p.username,p.display_name,p.avatar_id
    from public.player_profiles p where p.user_id=any(coalesce(p_user_ids,array[]::uuid[]));
end;
$$;

create or replace function public.adjust_player_inventory(p_user uuid,p_card_id text,p_rarity text,p_foil boolean,p_delta integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_quantity integer;
begin
  if p_delta=0 then return; end if;
  if p_delta>0 then
    insert into public.player_inventory(user_id,card_id,rarity,foil,quantity) values(p_user,p_card_id,p_rarity,p_foil,p_delta)
    on conflict(user_id,card_id,rarity,foil) do update set quantity=public.player_inventory.quantity+excluded.quantity;
  else
    update public.player_inventory set quantity=quantity+p_delta
      where user_id=p_user and card_id=p_card_id and rarity=p_rarity and foil=p_foil and quantity+p_delta>=0
      returning quantity into v_quantity;
    if not found then raise exception 'The required card copy is no longer available.'; end if;
    if v_quantity=0 then delete from public.player_inventory where user_id=p_user and card_id=p_card_id and rarity=p_rarity and foil=p_foil; end if;
  end if;
end;
$$;

create or replace function public.open_online_pack()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid(); v_marks integer; v_card public.card_catalog%rowtype;
  v_drawn text[] := array[]::text[]; v_result jsonb := '[]'::jsonb; v_rarity text; v_foil boolean; v_roll double precision;
begin
  if v_user is null then raise exception 'Sign in first.'; end if;
  if not private.mfa_aal2_or_not_enrolled() then raise exception 'Verify your authenticator before opening a pack.'; end if;
  select marks into v_marks from public.player_wallets where user_id=v_user for update;
  if not found then raise exception 'Player wallet is missing.'; end if;
  if v_marks<100 then raise exception 'You need 100 online marks for a pack.'; end if;
  update public.player_wallets set marks=marks-100 where user_id=v_user;
  for i in 1..5 loop
    select c.* into v_card from public.card_catalog c where not (c.card_id=any(v_drawn))
      order by -ln(greatest(random(),0.0000001))/c.pull_weight limit 1;
    if not found then exit; end if;
    v_roll:=random()*100;
    v_rarity:=case when v_roll<60 then 'common' when v_roll<85 then 'expensive' when v_roll<97 then 'extravagant' else 'exquisite' end;
    v_foil:=not v_card.is_scenic and random()<case when v_card.is_signature then 0.005 else 0.02 end;
    perform public.adjust_player_inventory(v_user,v_card.card_id,v_rarity,v_foil,1);
    v_drawn:=array_append(v_drawn,v_card.card_id);
    v_result:=v_result||jsonb_build_array(jsonb_build_object('card_id',v_card.card_id,'rarity',v_rarity,'foil',v_foil));
  end loop;
  return v_result;
end;
$$;

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
     or jsonb_array_length(p_offered_items) not between 1 and 50 or jsonb_array_length(p_requested_items) not between 1 and 50 then
    raise exception 'Add 1–50 card lines on both sides of the offer.';
  end if;
  select user_id into v_recipient from public.player_profiles where username=lower(trim(p_recipient_username));
  if v_recipient is null then raise exception 'Player not found.'; end if;
  if v_recipient=v_sender then raise exception 'You cannot trade with yourself.'; end if;
  perform 1 from public.player_profiles where user_id=v_sender for update;
  if (select count(*) from public.trade_offers where sender_user_id=v_sender and status='pending')>=10 then
    raise exception 'Resolve or cancel a pending offer before sending another.';
  end if;
  insert into public.trade_offers(sender_user_id,recipient_user_id) values(v_sender,v_recipient) returning id into v_offer;
  for v_item in
    select side,card_id,rarity,foil,sum(quantity)::integer as quantity
    from (
      select 'offered'::text as side,x.* from jsonb_to_recordset(p_offered_items) as x(card_id text,rarity text,foil boolean,quantity integer)
      union all select 'requested',x.* from jsonb_to_recordset(p_requested_items) as x(card_id text,rarity text,foil boolean,quantity integer)
    ) s group by side,card_id,rarity,foil
  loop
    if v_item.card_id is null or v_item.rarity not in ('common','expensive','extravagant','exquisite') or v_item.quantity not between 1 and 10000 then raise exception 'Invalid card, rarity, or quantity in trade.'; end if;
    select is_scenic into v_scenic from public.card_catalog where card_id=v_item.card_id;
    if not found then raise exception 'Unknown card in trade.'; end if;
    if v_item.foil and v_scenic then raise exception 'Scenic cards do not have foil prints.'; end if;
    insert into public.trade_offer_items(offer_id,side,card_id,rarity,foil,quantity) values(v_offer,v_item.side,v_item.card_id,v_item.rarity,coalesce(v_item.foil,false),v_item.quantity);
    if v_item.side='offered' then
      select quantity into v_have from public.player_inventory where user_id=v_sender and card_id=v_item.card_id and rarity=v_item.rarity and foil=coalesce(v_item.foil,false) for update;
      if not found or v_have<v_item.quantity then raise exception 'You do not have enough copies of an offered card.'; end if;
      perform public.adjust_player_inventory(v_sender,v_item.card_id,v_item.rarity,coalesce(v_item.foil,false),-v_item.quantity);
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
      perform public.adjust_player_inventory(v_offer.sender_user_id,v_item.card_id,v_item.rarity,v_item.foil,v_item.quantity);
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
    for v_item in select * from public.trade_offer_items where offer_id=v_offer.id and side='requested' order by card_id,rarity,foil loop
      select quantity into v_have from public.player_inventory where user_id=v_offer.recipient_user_id and card_id=v_item.card_id and rarity=v_item.rarity and foil=v_item.foil for update;
      if not found or v_have<v_item.quantity then raise exception 'The recipient no longer has enough copies of a requested card.'; end if;
      perform public.adjust_player_inventory(v_offer.recipient_user_id,v_item.card_id,v_item.rarity,v_item.foil,-v_item.quantity);
    end loop;
    for v_item in select * from public.trade_offer_items where offer_id=v_offer.id and side='requested' loop
      perform public.adjust_player_inventory(v_offer.sender_user_id,v_item.card_id,v_item.rarity,v_item.foil,v_item.quantity);
    end loop;
    for v_item in select * from public.trade_offer_items where offer_id=v_offer.id and side='offered' loop
      perform public.adjust_player_inventory(v_offer.recipient_user_id,v_item.card_id,v_item.rarity,v_item.foil,v_item.quantity);
    end loop;
    update public.trade_offers set status='accepted' where id=v_offer.id;
    return 'accepted';
  end if;
  for v_item in select * from public.trade_offer_items where offer_id=v_offer.id and side='offered' loop
    perform public.adjust_player_inventory(v_offer.sender_user_id,v_item.card_id,v_item.rarity,v_item.foil,v_item.quantity);
  end loop;
  update public.trade_offers set status=case when p_action='cancel' then 'cancelled' else 'declined' end where id=v_offer.id;
  return case when p_action='cancel' then 'cancelled' else 'declined' end;
end;
$$;

revoke all on function public.handle_new_player() from public,anon,authenticated;
revoke all on function public.update_player_profile(text,text,text) from public,anon,authenticated;
revoke all on function public.find_player(text) from public,anon,authenticated;
revoke all on function public.get_public_profiles(uuid[]) from public,anon,authenticated;
revoke all on function public.adjust_player_inventory(uuid,text,text,boolean,integer) from public,anon,authenticated;
revoke all on function public.open_online_pack() from public,anon,authenticated;
revoke all on function public.create_trade_offer(text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.resolve_trade_offer(uuid,text) from public,anon,authenticated;
grant execute on function public.update_player_profile(text,text,text) to authenticated;
grant execute on function public.find_player(text) to authenticated;
grant execute on function public.get_public_profiles(uuid[]) to authenticated;
grant execute on function public.open_online_pack() to authenticated;
grant execute on function public.create_trade_offer(text,jsonb,jsonb) to authenticated;
grant execute on function public.resolve_trade_offer(uuid,text) to authenticated;

