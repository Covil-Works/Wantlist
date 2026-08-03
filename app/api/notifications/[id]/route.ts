import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  await sql`
    update notifications
    set read_at = coalesce(read_at, now())
    where id = ${id} and recipient_id = ${profile.id}
  `;
  return NextResponse.json({ ok: true });
}
