import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireProfile } from "@/lib/auth";

export async function DELETE(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const profile = await requireProfile();
  const { userId } = await params;
  await sql`
    with removed_access as (
      update guest_accesses ga set status='removed'
      from wishlists w
      where ga.wishlist_id=w.id and w.owner_id=${profile.id} and ga.user_id=${userId}
      returning ga.wishlist_id
    )
    update notifications n
    set read_at = coalesce(n.read_at, now())
    from removed_access
    where n.recipient_id = ${userId}
      and n.wishlist_id = removed_access.wishlist_id
      and n.type = 'new_items'
      and n.read_at is null
  `;
  return NextResponse.json({ ok: true });
}
