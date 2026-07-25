import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireProfile } from "@/lib/auth";
import { hashToken } from "@/lib/random";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rows = await sql`
    select inv.status, w.title, p.display_name as owner_name
    from invites inv
    join wishlists w on w.id = inv.wishlist_id
    join profiles p on p.id = w.owner_id
    where inv.token_hash = ${hashToken(token)}
    limit 1
  `;
  return NextResponse.json({ invite: rows[0] || null });
}

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const profile = await requireProfile();
  const { token } = await params;
  const tokenHash = hashToken(token);

  const claimed = await sql`
    update invites
    set status = 'accepted', accepted_by = ${profile.id}, accepted_at = now()
    where token_hash = ${tokenHash} and status = 'pending'
    returning id, wishlist_id, accepted_by
  `;

  let invite = claimed[0];

  if (!invite) {
    const existing = await sql`
      select inv.id, inv.wishlist_id, inv.status, inv.accepted_by, ga.status as guest_status, w.public_code
      from invites inv
      join wishlists w on w.id = inv.wishlist_id
      left join guest_accesses ga on ga.wishlist_id = inv.wishlist_id and ga.user_id = ${profile.id}
      where inv.token_hash = ${tokenHash}
      limit 1
    `;
    invite = existing[0];
    if (!invite) return NextResponse.json({ error: "Convite inválido." }, { status: 404 });
    if (invite.status === "accepted" && invite.accepted_by === profile.id) {
      if (invite.guest_status === "active") return NextResponse.json({ ok: true, code: invite.public_code });
      if (invite.guest_status === "removed") return NextResponse.json({ error: "Este convite não está mais disponível." }, { status: 400 });
      await sql`
        insert into guest_accesses (user_id, wishlist_id, status)
        values (${profile.id}, ${invite.wishlist_id}, 'active')
        on conflict (user_id, wishlist_id) do nothing
      `;
      return NextResponse.json({ ok: true, code: invite.public_code });
    }
    return NextResponse.json({ error: "Este convite não está mais disponível." }, { status: 400 });
  }

  await sql`
    insert into guest_accesses (user_id, wishlist_id, status)
    values (${profile.id}, ${invite.wishlist_id}, 'active')
    on conflict (user_id, wishlist_id) do update set status = 'active', granted_at = now()
  `;

  const rows = await sql`
    select w.public_code, ga.status as guest_status
    from wishlists w
    join guest_accesses ga on ga.wishlist_id = w.id and ga.user_id = ${profile.id}
    where w.id = ${invite.wishlist_id}
    limit 1
  `;
  if (rows[0]?.guest_status !== "active") {
    return NextResponse.json({ error: "Este convite não está mais disponível." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, code: rows[0].public_code });
}