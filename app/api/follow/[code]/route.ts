import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireProfile } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const profile = await requireProfile();
  const { code } = await params;
  const rows = await sql`select id, owner_id, visibility from wishlists where public_code = ${code} limit 1`;
  const wishlist = rows[0];
  if (!wishlist || wishlist.visibility !== "public" || wishlist.owner_id === profile.id) return NextResponse.json({ error: "Não é possível seguir." }, { status: 403 });
  await sql`
    with followed as (
      insert into followers (user_id, wishlist_id)
      values (${profile.id}, ${wishlist.id})
      on conflict do nothing
      returning wishlist_id
    )
    insert into wishlist_views (user_id, wishlist_id, last_viewed_revision)
    select ${profile.id}, w.id, w.items_revision
    from wishlists w
    join followed on followed.wishlist_id = w.id
    where w.id = ${wishlist.id}
    on conflict (user_id, wishlist_id) do update
      set last_viewed_revision = excluded.last_viewed_revision, updated_at = now()
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const profile = await requireProfile();
  const { code } = await params;
  await sql`
    with unfollowed as (
      delete from followers f
      using wishlists w
      where f.wishlist_id = w.id
        and w.public_code = ${code}
        and f.user_id = ${profile.id}
      returning f.wishlist_id
    )
    update notifications n
    set read_at = coalesce(n.read_at, now())
    from unfollowed
    where n.recipient_id = ${profile.id}
      and n.wishlist_id = unfollowed.wishlist_id
      and n.type = 'new_items'
      and n.read_at is null
  `;
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const profile = await requireProfile();
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  const requestedRevision = Number(body.viewRevision);
  if (!Number.isSafeInteger(requestedRevision) || requestedRevision < 0) {
    return NextResponse.json({ error: 'Revisão de visualização inválida.' }, { status: 400 });
  }
  const rows = await sql`
    with viewable_wishlist as (
      select w.id, least(w.items_revision, ${requestedRevision}::bigint) as viewed_revision
      from wishlists w
      where w.public_code = ${code}
        and (
          exists (select 1 from followers f where f.wishlist_id = w.id and f.user_id = ${profile.id})
          or exists (
            select 1 from guest_accesses ga
            where ga.wishlist_id = w.id and ga.user_id = ${profile.id} and ga.status = 'active'
          )
        )
    ), recorded_view as (
      insert into wishlist_views (user_id, wishlist_id, last_viewed_revision)
      select ${profile.id}, viewable_wishlist.id, viewable_wishlist.viewed_revision
      from viewable_wishlist
      on conflict (user_id, wishlist_id) do update
        set last_viewed_revision = greatest(wishlist_views.last_viewed_revision, excluded.last_viewed_revision),
          updated_at = now()
      returning wishlist_id, last_viewed_revision
    ), read_notifications as (
      update notifications n
      set read_at = coalesce(n.read_at, now())
      from recorded_view
      where n.recipient_id = ${profile.id}
        and n.wishlist_id = recorded_view.wishlist_id
        and n.type = 'new_items'
        and n.read_at is null
        and coalesce(n.item_revision, 0) <= recorded_view.last_viewed_revision
      returning n.id
    )
    select last_viewed_revision from recorded_view
  `;
  return NextResponse.json({ ok: true, viewedRevision: rows[0]?.last_viewed_revision ?? null });
}
