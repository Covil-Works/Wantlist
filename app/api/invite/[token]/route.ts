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
  const rows = await sql`select * from invites where token_hash = ${hashToken(token)} limit 1`;
  const invite = rows[0];
  if (!invite) return NextResponse.json({ error: "Convite invalido." }, { status: 404 });
  if (invite.status !== "pending") return NextResponse.json({ error: "Convite indisponivel." }, { status: 400 });
  await sql`update invites set status='accepted', accepted_by=${profile.id}, accepted_at=now() where id=${invite.id} and status='pending'`;
  await sql`
    insert into guest_accesses (user_id, wishlist_id, status) values (${profile.id}, ${invite.wishlist_id}, 'active')
    on conflict (user_id, wishlist_id) do update set status='active', granted_at=now()
  `;
  const wishlist = await sql`select public_code from wishlists where id=${invite.wishlist_id}`;
  return NextResponse.json({ ok: true, code: wishlist[0].public_code });
}
