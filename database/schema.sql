create extension if not exists pgcrypto;

do $$ begin
  create type wishlist_visibility as enum ('public', 'invited', 'private');
exception when duplicate_object then null; end $$;

do $$ begin
  create type invite_status as enum ('pending', 'accepted', 'revoked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type guest_access_status as enum ('active', 'removed');
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null unique,
  display_name varchar(80) not null,
  username varchar(40) not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9._-]{3,40}$')
);

create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title varchar(100) not null,
  public_code varchar(24) not null unique,
  visibility wishlist_visibility not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id)
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  name varchar(140) not null,
  description varchar(700),
  image_url varchar(1000),
  original_url varchar(1000),
  domain varchar(180),
  podium_position smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_podium_position_check check (podium_position between 1 and 3)
);

alter table items alter column original_url drop not null;
alter table items alter column domain drop not null;
alter table items add column if not exists podium_position smallint;

do $$ begin
  alter table items add constraint items_podium_position_check check (podium_position between 1 and 3);
exception when duplicate_object then null; end $$;

create unique index if not exists items_wishlist_podium_position_unique
  on items (wishlist_id, podium_position)
  where podium_position is not null;

create table if not exists followers (
  user_id uuid not null references profiles(id) on delete cascade,
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, wishlist_id)
);

create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  token_hash text not null unique,
  status invite_status not null default 'pending',
  accepted_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz
);

create table if not exists guest_accesses (
  user_id uuid not null references profiles(id) on delete cascade,
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  status guest_access_status not null default 'active',
  granted_at timestamptz not null default now(),
  primary key (user_id, wishlist_id)
);

create table if not exists reservations (
  item_id uuid primary key references items(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
