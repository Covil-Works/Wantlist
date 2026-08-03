do $$ begin
  create type notification_type as enum ('new_items', 'item_reserved', 'podium_item_reserved');
exception when duplicate_object then null; end $$;

alter table followers
  add column if not exists last_viewed_at timestamptz not null default now();

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  item_id uuid references items(id) on delete set null,
  type notification_type not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_recipient_created_at_idx
  on notifications (recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on notifications (recipient_id, created_at desc)
  where read_at is null;

create unique index if not exists notifications_unread_new_items_unique
  on notifications (recipient_id, wishlist_id, type)
  where read_at is null and type = 'new_items';
