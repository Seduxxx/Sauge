-- ============================================================================
--  SAUGE — schéma Supabase (à exécuter UNE fois dans « SQL Editor »)
--  Remplace l'ancien serveur Node + SQLite. Toute la logique sensible
--  (rôles, formule Plus, versions, modération) vit ici, côté base de données.
--  Les tables sont fermées (RLS sans politique) : le navigateur ne peut
--  appeler que les fonctions « api_* » ci-dessous.
-- ============================================================================

-- ---------- Tables ----------------------------------------------------------
create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  pseudonym text not null check(char_length(pseudonym) between 1 and 40 and pseudonym !~ '[<>]'),
  role text not null default 'member' check(role in ('member','admin')),
  plan text not null default 'free' check(plan in ('free','plus')),
  created_at timestamptz not null default now()
);
create table if not exists public.snapshots(
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision integer not null default 0
);
create table if not exists public.recipes(
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check(kind in ('private','publication')),
  status text not null,
  data jsonb not null,
  review jsonb,
  source_id text,
  version integer not null default 1,
  reason text not null default '',
  created_at timestamptz not null default now()
);
create unique index if not exists one_public_copy on public.recipes(source_id) where kind='publication';
create index if not exists recipes_owner on public.recipes(owner_id);
create table if not exists public.ratings(
  recipe_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  stars integer not null check(stars between 1 and 5),
  primary key(recipe_id,user_id)
);
create table if not exists public.moderation_log(
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id),
  recipe_id text not null,
  action text not null,
  created_at timestamptz not null default now()
);
-- Recettes du catalogue de base qui ont une photo vérifiée (notables par les membres).
create table if not exists public.base_recipes(id text primary key);

-- Tables fermées : aucun accès direct depuis le navigateur.
alter table public.profiles enable row level security;
alter table public.snapshots enable row level security;
alter table public.recipes enable row level security;
alter table public.ratings enable row level security;
alter table public.moderation_log enable row level security;
alter table public.base_recipes enable row level security;
revoke all on public.profiles,public.snapshots,public.recipes,public.ratings,public.moderation_log,public.base_recipes from anon,authenticated;

-- ---------- Création automatique du profil à l'inscription ---------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
declare p text;
begin
  p := btrim(coalesce(new.raw_user_meta_data->>'pseudonym',''));
  if p = '' or char_length(p) > 40 or p ~ '[<>]' then p := 'Membre'; end if;
  -- Le rôle et la formule ne viennent JAMAIS des données d'inscription.
  insert into public.profiles(id,pseudonym) values(new.id,p);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Outils internes (non appelables depuis le navigateur) ----------------
create or replace function public._fail(msg text, code int) returns void
language plpgsql as $$ begin raise exception '%', msg using errcode='P0001', hint=code::text; end $$;

create or replace function public._me() returns public.profiles
language plpgsql stable security definer set search_path=public as $$
declare r public.profiles;
begin
  select * into r from public.profiles where id=auth.uid();
  if not found then perform public._fail('Connectez-vous pour sauvegarder.',401); end if;
  return r;
end $$;

create or replace function public._admin() returns public.profiles
language plpgsql stable security definer set search_path=public as $$
declare r public.profiles;
begin
  r := public._me();
  if r.role <> 'admin' then perform public._fail('Accès réservé à l’administration.',403); end if;
  return r;
end $$;

create or replace function public._check_recipe(d jsonb) returns void
language plpgsql as $$
declare ok boolean;
begin
  if d is null or jsonb_typeof(d) is distinct from 'object' then perform public._fail('Recette invalide.',400); end if;
  if length(d::text) > 1200000 then perform public._fail('Recette trop volumineuse.',400); end if;
  if d::text ~ '[<>]' then perform public._fail('Texte invalide ou trop long.',400); end if;
  ok := case when jsonb_typeof(d->'name')='string' then char_length(d->>'name') between 1 and 100 else false end;
  if not ok then perform public._fail('Texte invalide ou trop long.',400); end if;
  ok := case when jsonb_typeof(d->'ingredients')='array' then jsonb_array_length(d->'ingredients') between 1 and 60 else false end;
  if not ok then perform public._fail('Ajoutez de 1 à 60 ingrédients.',400); end if;
  ok := case when jsonb_typeof(d->'steps')='array' then jsonb_array_length(d->'steps') between 1 and 30 else false end;
  if not ok then perform public._fail('Ajoutez de 1 à 30 étapes.',400); end if;
  if coalesce(d->>'photo','')<>'' and (d->>'photo') !~ '^data:image/(jpeg|png);base64,[A-Za-z0-9+/=]+$' then perform public._fail('Utilisez une photo JPEG ou PNG.',400); end if;
end $$;

create or replace function public._serialize(r public.recipes, as_admin boolean default false) returns jsonb
language sql stable security definer set search_path=public as $$
  select jsonb_build_object('id',r.id,'ownerId',r.owner_id,'kind',r.kind,'status',r.status,'version',r.version,
    'sourceId',r.source_id,'reason',r.reason,
    'creator',coalesce((select pseudonym from public.profiles where id=r.owner_id),'Membre'),
    'data',case when as_admin and r.review is not null then r.review else r.data end)
$$;

create or replace function public._stats(k text) returns jsonb
language sql stable security definer set search_path=public as $$
  select jsonb_build_object('count',count(*),'average',coalesce(avg(stars),0),
    'mine',coalesce(max(stars) filter(where user_id=auth.uid()),0))
  from public.ratings where recipe_id=k
$$;

-- ---------- API : session et sauvegarde personnelle -----------------------------
create or replace function public.api_session() returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare p public.profiles; s public.snapshots;
begin
  select * into p from public.profiles where id=auth.uid();
  if not found then return jsonb_build_object('user',null,'snapshot',null); end if;
  select * into s from public.snapshots where user_id=p.id;
  return jsonb_build_object(
    'user',jsonb_build_object('id',p.id,'pseudonym',p.pseudonym,'role',p.role,'plan',p.plan),
    'snapshot',case when s.user_id is null then jsonb_build_object('data',null,'revision',0)
                    when s.data = 'null'::jsonb then jsonb_build_object('data',null,'revision',s.revision)
                    else jsonb_build_object('data',s.data,'revision',s.revision) end);
end $$;

create or replace function public.api_state_get() returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare me public.profiles;
begin
  me := public._me();
  return (public.api_session())->'snapshot';
end $$;

create or replace function public.api_state_put(p_data jsonb, p_revision integer) returns jsonb
language plpgsql security definer set search_path=public as $$
declare me public.profiles; cur public.snapshots; old_events jsonb; new_events jsonb;
begin
  me := public._me();
  if p_data is null or jsonb_typeof(p_data)<>'object' or length(p_data::text)>1500000 then
    perform public._fail('Sauvegarde invalide ou trop volumineuse.',400);
  end if;
  insert into public.snapshots(user_id,data,revision) values(me.id,'null'::jsonb,0) on conflict(user_id) do nothing;
  select * into cur from public.snapshots where user_id=me.id for update;
  if me.plan <> 'plus' then
    if p_data#>>'{profile,lunchStyle}'='transform' or p_data#>>'{baseProfile,lunchStyle}'='transform' then
      perform public._fail('Transformer les lunchs nécessite Sauge Plus.',403);
    end if;
    new_events := p_data#>'{profile,events}';
    old_events := coalesce(cur.data#>'{profile,events}','{}'::jsonb);
    if new_events is not null and jsonb_typeof(new_events)='object' and new_events <> '{}'::jsonb and new_events <> old_events then
      perform public._fail('Organiser une occasion nécessite Sauge Plus.',403);
    end if;
  end if;
  if p_revision is distinct from cur.revision then
    perform public._fail('Une version plus récente existe. Rechargez vos données avant de continuer.',409);
  end if;
  update public.snapshots set data=p_data, revision=cur.revision+1 where user_id=me.id;
  return jsonb_build_object('revision',cur.revision+1);
end $$;

-- ---------- API : catalogue et évaluations ---------------------------------------
create or replace function public.api_catalogue() returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare uid uuid := auth.uid(); rows_json jsonb; stats jsonb; base_stats jsonb;
begin
  select coalesce(jsonb_agg(public._serialize(r) order by r.created_at desc),'[]'::jsonb) into rows_json
    from public.recipes r
    where (r.kind='publication' and r.status='published') or (uid is not null and r.kind='private' and r.owner_id=uid);
  select coalesce(jsonb_object_agg(r.id,public._stats(coalesce(r.source_id,r.id))),'{}'::jsonb) into stats
    from public.recipes r
    where (r.kind='publication' and r.status='published') or (uid is not null and r.kind='private' and r.owner_id=uid);
  select coalesce(jsonb_object_agg(b.id,public._stats(b.id)),'{}'::jsonb) into base_stats from public.base_recipes b;
  return jsonb_build_object('recipes',rows_json,'ratings',base_stats || stats);
end $$;

create or replace function public.api_rate(p_id text, p_stars integer) returns jsonb
language plpgsql security definer set search_path=public as $$
declare me public.profiles; row public.recipes; k text;
begin
  me := public._me();
  if exists(select 1 from public.base_recipes where id=p_id) then k := p_id;
  else
    select * into row from public.recipes where id=p_id;
    if not found or not ((row.kind='publication' and row.status='published') or row.owner_id=me.id) then
      perform public._fail('Recette introuvable.',404);
    end if;
    k := coalesce(row.source_id,row.id);
  end if;
  if p_stars is null or p_stars<1 or p_stars>5 then perform public._fail('Choisissez de 1 à 5 étoiles.',400); end if;
  insert into public.ratings(recipe_id,user_id,stars) values(k,me.id,p_stars)
    on conflict(recipe_id,user_id) do update set stars=excluded.stars;
  return public._stats(k);
end $$;

-- ---------- API : recettes privées ---------------------------------------------------
create or replace function public.api_recipe_create(p_data jsonb, p_submit boolean default false) returns jsonb
language plpgsql security definer set search_path=public as $$
declare me public.profiles; nid text; row public.recipes;
begin
  me := public._me();
  perform public._check_recipe(p_data);
  if p_submit and coalesce(p_data->>'rightsConfirmed','')<>'true' then perform public._fail('Confirmez vos droits avant la proposition.',400); end if;
  if (select count(*) from public.recipes where owner_id=me.id and kind='private')>=200 then perform public._fail('Limite de 200 recettes personnelles.',400); end if;
  nid := 'own-'||gen_random_uuid()::text;
  insert into public.recipes(id,owner_id,kind,status,data,version)
    values(nid,me.id,'private',case when p_submit then 'pending' else 'private' end,p_data,case when p_submit then 2 else 1 end)
    returning * into row;
  return public._serialize(row);
end $$;

create or replace function public.api_recipe_edit(p_id text, p_version integer, p_data jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare me public.profiles; row public.recipes;
begin
  me := public._me();
  select * into row from public.recipes where id=p_id for update;
  if not found or row.kind<>'private' or row.owner_id<>me.id then perform public._fail('Recette introuvable.',404); end if;
  if p_version is distinct from row.version then perform public._fail('Cette recette a changé. Rechargez-la.',409); end if;
  perform public._check_recipe(p_data);
  update public.recipes set data=p_data,status='private',review=null,reason='',version=version+1 where id=p_id returning * into row;
  return public._serialize(row);
end $$;

create or replace function public.api_recipe_delete(p_id text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare me public.profiles; row public.recipes;
begin
  me := public._me();
  select * into row from public.recipes where id=p_id;
  if not found or row.kind<>'private' or row.owner_id<>me.id then perform public._fail('Recette introuvable.',404); end if;
  delete from public.recipes where id=p_id;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.api_recipe_submit(p_id text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare me public.profiles; row public.recipes;
begin
  me := public._me();
  select * into row from public.recipes where id=p_id for update;
  if not found or row.kind<>'private' or row.owner_id<>me.id then perform public._fail('Recette introuvable.',404); end if;
  if coalesce(row.data->>'rightsConfirmed','')<>'true' then perform public._fail('Confirmez les droits sur le texte et la photo avant de proposer cette recette.',400); end if;
  update public.recipes set status='pending',reason='',review=null,version=version+1 where id=p_id returning * into row;
  return public._serialize(row);
end $$;

-- ---------- API : administration et modération ---------------------------------------
create or replace function public.api_admin_list() returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare me public.profiles;
begin
  me := public._admin();
  return jsonb_build_object('recipes',coalesce((select jsonb_agg(public._serialize(r,true) order by r.created_at desc)
    from public.recipes r where r.status='pending' or r.kind='publication'),'[]'::jsonb));
end $$;

create or replace function public.api_admin_edit(p_id text, p_version integer, p_data jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare me public.profiles; row public.recipes;
begin
  me := public._admin();
  select * into row from public.recipes where id=p_id for update;
  if not found or not (row.status='pending' or row.kind='publication') then perform public._fail('Proposition introuvable.',404); end if;
  if p_version is distinct from row.version then perform public._fail('Cette proposition a changé.',409); end if;
  perform public._check_recipe(p_data);
  if row.kind='publication' then update public.recipes set data=p_data,version=version+1 where id=p_id returning * into row;
  else update public.recipes set review=p_data,version=version+1 where id=p_id returning * into row; end if;
  return public._serialize(row,true);
end $$;

create or replace function public.api_admin_moderate(p_id text, p_action text, p_version integer, p_reviewed boolean default false, p_reason text default '') returns jsonb
language plpgsql security definer set search_path=public as $$
declare me public.profiles; row public.recipes; d jsonb; existing text;
begin
  me := public._admin();
  if p_action not in ('approve','reject','unpublish') then perform public._fail('Action invalide.',400); end if;
  select * into row from public.recipes where id=p_id for update;
  if not found then perform public._fail('Recette introuvable.',404); end if;
  if p_version is distinct from row.version then perform public._fail('La recette a changé depuis votre lecture.',409); end if;
  if p_action='unpublish' then
    if row.kind<>'publication' then perform public._fail('Publication requise.',400); end if;
    update public.recipes set status='unpublished',version=version+1 where id=p_id;
  else
    if row.kind<>'private' or row.status<>'pending' then perform public._fail('Une proposition en attente est requise.',400); end if;
    if p_action='reject' then
      update public.recipes set status='rejected',reason=left(coalesce(p_reason,''),500),version=version+1 where id=p_id;
    else
      if not coalesce(p_reviewed,false) then perform public._fail('Confirmez la vérification des ingrédients, allergènes, quantités, étapes, photo et droits.',400); end if;
      d := coalesce(row.review,row.data);
      perform public._check_recipe(d);
      if coalesce(d->>'rightsConfirmed','')<>'true' then perform public._fail('Droits non confirmés.',400); end if;
      select id into existing from public.recipes where source_id=p_id and kind='publication';
      if existing is not null then update public.recipes set data=d,status='published',version=version+1 where id=existing;
      else insert into public.recipes(id,owner_id,kind,status,data,source_id) values('pub-'||gen_random_uuid()::text,row.owner_id,'publication','published',d,p_id); end if;
      update public.recipes set status='published',version=version+1 where id=p_id;
    end if;
  end if;
  insert into public.moderation_log(admin_id,recipe_id,action) values(me.id,p_id,p_action);
  return jsonb_build_object('ok',true);
end $$;

-- ---------- Droits d'exécution -------------------------------------------------------------
revoke all on function public._fail(text,int),public._me(),public._admin(),public._check_recipe(jsonb),
  public._serialize(public.recipes,boolean),public._stats(text),public.handle_new_user() from public,anon,authenticated;

revoke all on function public.api_session(),public.api_catalogue() from public;
grant execute on function public.api_session(),public.api_catalogue() to anon,authenticated;

revoke all on function public.api_state_get(),public.api_state_put(jsonb,integer),public.api_rate(text,integer),
  public.api_recipe_create(jsonb,boolean),public.api_recipe_edit(text,integer,jsonb),public.api_recipe_delete(text),
  public.api_recipe_submit(text),public.api_admin_list(),public.api_admin_edit(text,integer,jsonb),
  public.api_admin_moderate(text,text,integer,boolean,text) from public,anon;
grant execute on function public.api_state_get(),public.api_state_put(jsonb,integer),public.api_rate(text,integer),
  public.api_recipe_create(jsonb,boolean),public.api_recipe_edit(text,integer,jsonb),public.api_recipe_delete(text),
  public.api_recipe_submit(text),public.api_admin_list(),public.api_admin_edit(text,integer,jsonb),
  public.api_admin_moderate(text,text,integer,boolean,text) to authenticated;
