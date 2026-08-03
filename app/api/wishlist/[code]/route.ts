import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getOptionalProfile } from "@/lib/auth";
import { canViewWishlist } from "@/lib/permissions";
import type { Wishlist } from "@/lib/types";

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getOptionalProfile();
  const rows = await sql`
    select w.*, p.display_name as owner_name
    from wishlists w join profiles p on p.id = w.owner_id
    where w.public_code = ${code} limit 1
  `;
  const wishlist = rows[0] as Wishlist | undefined;
  if (!wishlist || !(await canViewWishlist(wishlist, profile))) {
    return NextResponse.json({ error: "Conteúdo indisponível." }, { status: 404 });
  }
  const accessState = profile
    ? await sql`
        select v.last_viewed_revision, (f.user_id is not null) as following
        from profiles p
        left join followers f on f.user_id = p.id and f.wishlist_id = ${wishlist.id}
        left join guest_accesses ga on ga.user_id = p.id and ga.wishlist_id = ${wishlist.id} and ga.status = 'active'
        left join wishlist_views v on v.user_id = p.id and v.wishlist_id = ${wishlist.id}
          and (f.user_id is not null or ga.user_id is not null)
        where p.id = ${profile.id}
      `
    : [];
  const lastViewedRevision = accessState[0]?.last_viewed_revision ?? null;
  const viewRevision = Number((wishlist as Wishlist & { items_revision: number | string }).items_revision);
  const items = await sql`
    select i.*,
      (r.item_id is not null) as reserved,
      (${profile?.id || null}::uuid is not null and r.user_id = ${profile?.id || null}) as reserved_by_me,
      (${lastViewedRevision}::bigint is not null and i.created_revision > ${lastViewedRevision}::bigint) as is_new
    from items i
    left join reservations r on r.item_id = i.id
    where i.wishlist_id = ${wishlist.id}
      and i.created_revision <= ${viewRevision}
    order by i.created_at desc
  `;
  return NextResponse.json({
    wishlist,
    items,
    viewer: profile,
    isOwner: profile?.id === wishlist.owner_id,
    following: Boolean(accessState[0]?.following),
    tracksUpdates: lastViewedRevision !== null,
    viewRevision,
  });
}
