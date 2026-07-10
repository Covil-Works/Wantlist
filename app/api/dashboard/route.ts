import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireProfile } from "@/lib/auth";

export async function GET() {
  const profile = await requireProfile();
  const mine = await sql`
    select w.*,
      count(i.id)::int as item_count,
      count(r.item_id)::int as reserved_count
    from wishlists w
    left join items i on i.wishlist_id = w.id
    left join reservations r on r.item_id = i.id
    where w.owner_id = ${profile.id}
    group by w.id
    limit 1
  `;
  const following = await sql`
    select w.public_code, w.title, w.visibility, p.display_name as owner_name,
      count(i.id)::int as item_count, w.updated_at,
      case when ga.user_id is not null then 'convidado' else 'publica' end as access_type
    from wishlists w
    join profiles p on p.id = w.owner_id
    left join items i on i.wishlist_id = w.id
    left join followers f on f.wishlist_id = w.id and f.user_id = ${profile.id}
    left join guest_accesses ga on ga.wishlist_id = w.id and ga.user_id = ${profile.id} and ga.status = 'active'
    where w.owner_id <> ${profile.id} and (f.user_id is not null or ga.user_id is not null)
    group by w.id, p.display_name, ga.user_id
    order by w.updated_at desc
  `;
  return NextResponse.json({ profile, wishlist: mine[0] || null, following });
}
