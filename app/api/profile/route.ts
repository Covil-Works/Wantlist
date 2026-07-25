import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireFirebaseUid } from "@/lib/auth";
import { profileSchema } from "@/lib/validators";

export async function GET() {
  const uid = await requireFirebaseUid();
  const rows = await sql`select * from profiles where firebase_uid = ${uid} limit 1`;
  return NextResponse.json({ profile: rows[0] || null });
}

export async function POST(request: Request) {
  try {
    const uid = await requireFirebaseUid();
    const body = profileSchema.parse(await request.json());
    const rows = await sql`
      insert into profiles (firebase_uid, display_name, username)
      values (${uid}, ${body.displayName}, ${body.username})
      on conflict (firebase_uid) do update set
        display_name = excluded.display_name,
        username = excluded.username,
        updated_at = now()
      returning *
    `;
    return NextResponse.json({ profile: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar o perfil.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
