import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireProfile } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const profile = await requireProfile();
  const { code } = await params;
  const rows = await sql`select id, owner_id, visibility from wishlists where public_code = ${code} limit 1`;
  const wishlist = rows[0];
  if (!wishlist || wishlist.visibility !== "public" || wishlist.owner_id === profile.id) return NextResponse.json({ error: "Não é possível seguir." }, { status: 403 });
  await sql`insert into followers (user_id, wishlist_id) values (${profile.id}, ${wishlist.id}) on conflict do nothing`;
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

export async function PATCH(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const profile = await requireProfile();
  const { code } = await params;
  await sql`
    with viewed_wishlist as (
      update followers f
      set last_viewed_at = now()
      from wishlists w
      where f.wishlist_id = w.id
        and w.public_code = ${code}
        and f.user_id = ${profile.id}
      returning f.wishlist_id
    )
    update notifications n
    set read_at = coalesce(n.read_at, now())
    from viewed_wishlist
    where n.recipient_id = ${profile.id}
      and n.wishlist_id = viewed_wishlist.wishlist_id
      and n.type = 'new_items'
      and n.read_at is null
  `;
  return NextResponse.json({ ok: true });
}
