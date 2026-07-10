import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireProfile } from "@/lib/auth";
import { domainFromUrl, itemSchema } from "@/lib/validators";

async function ownsItem(profileId: string, itemId: string) {
  const rows = await sql`select i.* from items i join wishlists w on w.id = i.wishlist_id where i.id = ${itemId} and w.owner_id = ${profileId}`;
  return rows[0];
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await requireProfile();
    const { id } = await params;
    if (!(await ownsItem(profile.id, id))) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    const body = itemSchema.parse(await request.json());
    const rows = await sql`
      update items set name=${body.name}, description=${body.description || null}, image_url=${body.imageUrl || null},
      original_url=${body.originalUrl}, domain=${domainFromUrl(body.originalUrl)}, updated_at=now()
      where id=${id} returning *
    `;
    return NextResponse.json({ item: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao editar." }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  if (!(await ownsItem(profile.id, id))) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  await sql`delete from items where id = ${id}`;
  return NextResponse.json({ ok: true });
}
