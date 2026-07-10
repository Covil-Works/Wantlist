import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireProfile } from "@/lib/auth";

export async function DELETE(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const profile = await requireProfile();
  const { userId } = await params;
  await sql`
    update guest_accesses ga set status='removed'
    from wishlists w
    where ga.wishlist_id=w.id and w.owner_id=${profile.id} and ga.user_id=${userId}
  `;
  return NextResponse.json({ ok: true });
}
