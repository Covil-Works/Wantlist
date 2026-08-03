alter table wishlists
  add column if not exists items_revision bigint not null default 0;

alter table items
  add column if not exists created_revision bigint;

with ranked_items as (
  select id,
    row_number() over (partition by wishlist_id order by created_at, id)::bigint as revision
  from items
)
update items i
set created_revision = ranked_items.revision
from ranked_items
where i.id = ranked_items.id
  and i.created_revision is null;

update wishlists w
set items_revision = coalesce((
  select max(i.created_revision)
  from items i
  where i.wishlist_id = w.id
), 0);

alter table items
  alter column created_revision set not null;

create unique index if not exists items_wishlist_created_revision_unique
  on items (wishlist_id, created_revision);

alter table notifications
  add column if not exists item_revision bigint;

update notifications n
set item_revision = i.created_revision
from items i
where n.item_id = i.id
  and n.item_revision is null;

create table if not exists wishlist_views (
  user_id uuid not null references profiles(id) on delete cascade,
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  last_viewed_revision bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, wishlist_id)
);

insert into wishlist_views (user_id, wishlist_id, last_viewed_revision)
select f.user_id, f.wishlist_id,
  coalesce(max(i.created_revision) filter (where i.created_at <= f.last_viewed_at), 0)
from followers f
left join items i on i.wishlist_id = f.wishlist_id
group by f.user_id, f.wishlist_id
on conflict (user_id, wishlist_id) do nothing;

insert into wishlist_views (user_id, wishlist_id, last_viewed_revision)
select ga.user_id, ga.wishlist_id, w.items_revision
from guest_accesses ga
join wishlists w on w.id = ga.wishlist_id
where ga.status = 'active'
on conflict (user_id, wishlist_id) do nothing;
