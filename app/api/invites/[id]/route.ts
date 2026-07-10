import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireProfile } from "@/lib/auth";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  await sql`
    update invites inv set status='revoked', revoked_at=now()
    from wishlists w
    where inv.id=${id} and inv.wishlist_id=w.id and w.owner_id=${profile.id} and inv.status='pending'
  `;
  return NextResponse.json({ ok: true });
}
