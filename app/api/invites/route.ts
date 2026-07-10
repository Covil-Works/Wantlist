import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireProfile } from "@/lib/auth";
import { hashToken, randomCode } from "@/lib/random";

export async function GET() {
  const profile = await requireProfile();
  const rows = await sql`
    select inv.id, inv.status, inv.created_at, inv.accepted_at, inv.revoked_at
    from invites inv join wishlists w on w.id = inv.wishlist_id
    where w.owner_id = ${profile.id}
    order by inv.created_at desc
  `;
  const guests = await sql`
    select ga.user_id, ga.status, ga.granted_at, p.display_name, p.username
    from guest_accesses ga
    join profiles p on p.id = ga.user_id
    join wishlists w on w.id = ga.wishlist_id
    where w.owner_id = ${profile.id}
    order by ga.granted_at desc
  `;
  return NextResponse.json({ invites: rows, guests });
}

export async function POST() {
  const profile = await requireProfile();
  const wishlists = await sql`select id from wishlists where owner_id = ${profile.id} limit 1`;
  const wishlist = wishlists[0];
  if (!wishlist) return NextResponse.json({ error: "Crie uma wishlist primeiro." }, { status: 400 });
  const token = randomCode(24);
  await sql`insert into invites (wishlist_id, token_hash) values (${wishlist.id}, ${hashToken(token)})`;
  return NextResponse.json({ token, url: `/convite/${token}` });
}
