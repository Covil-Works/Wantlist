import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { sql } from "@/lib/db";

const podiumSchema = z.object({
  position: z.union([z.literal(1), z.literal(2), z.literal(3), z.null()]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await requireProfile();
    const { id } = await params;
    const { position } = podiumSchema.parse(await request.json());

    const rows = await sql`
      with selected_item as (
        select i.id, i.wishlist_id
        from items i
        join wishlists w on w.id = i.wishlist_id
        where i.id = ${id} and w.owner_id = ${profile.id}
      ),
      cleared_position as (
        update items
        set podium_position = null, updated_at = now()
        where wishlist_id = (select wishlist_id from selected_item)
          and podium_position = ${position}
          and id <> ${id}
      )
      update items
      set podium_position = ${position}, updated_at = now()
      where id = (select id from selected_item)
      returning *
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Item não encontrado ou sem permissão." }, { status: 404 });
    }

    return NextResponse.json({ item: rows[0] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível atualizar o pódio." },
      { status: 400 },
    );
  }
}
