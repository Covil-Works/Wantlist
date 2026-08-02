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
  const followState = profile
    ? await sql`
        select last_viewed_at
        from followers
        where user_id = ${profile.id} and wishlist_id = ${wishlist.id}
        limit 1
      `
    : [];
  const lastViewedAt = followState[0]?.last_viewed_at || null;
  const items = await sql`
    select i.*,
      (r.item_id is not null) as reserved,
      (${profile?.id || null}::uuid is not null and r.user_id = ${profile?.id || null}) as reserved_by_me,
      (${lastViewedAt}::timestamptz is not null and i.created_at > ${lastViewedAt}::timestamptz) as is_new
    from items i
    left join reservations r on r.item_id = i.id
    where i.wishlist_id = ${wishlist.id}
    order by i.created_at desc
  `;
  return NextResponse.json({ wishlist, items, viewer: profile, isOwner: profile?.id === wishlist.owner_id, following: followState.length > 0 });
}
