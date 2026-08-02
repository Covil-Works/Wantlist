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
        select i.id, i.wishlist_id, i.podium_position
        from items i
        join wishlists w on w.id = i.wishlist_id
        where i.id = ${id} and w.owner_id = ${profile.id}
      ),
      podium_state as (
        select count(*)::int as item_count
        from items
        where wishlist_id = (select wishlist_id from selected_item)
          and podium_position is not null
      ),
      valid_change as (
        select selected_item.*
        from selected_item, podium_state
        where ${position}::smallint is null
          or (
            not exists (select 1 from reservations r where r.item_id = selected_item.id)
            and selected_item.podium_position is null
            and ${position}::smallint = podium_state.item_count + 1
            and podium_state.item_count < 3
          )
      ),
      cleared_item as (
        update items
        set podium_position = null, updated_at = now()
        where id = (select id from valid_change)
          and ${position}::smallint is null
        returning id, wishlist_id, (select podium_position from valid_change) as previous_position
      ),
      shifted_second as (
        update items
        set podium_position = podium_position - 1, updated_at = now()
        where wishlist_id = (select wishlist_id from cleared_item)
          and podium_position = (select previous_position + 1 from cleared_item)
        returning wishlist_id
      ),
      shifted_third as (
        update items
        set podium_position = podium_position - 1, updated_at = now()
        where wishlist_id = (select wishlist_id from shifted_second)
          and podium_position = (select previous_position + 2 from cleared_item)
        returning wishlist_id
      ),
      assigned_item as (
        update items
        set podium_position = ${position}, updated_at = now()
        where id = (select id from valid_change)
          and ${position}::smallint is not null
        returning id
      )
      select id from assigned_item
      union all
      select id from cleared_item
      limit 1
    `;

    if (!rows[0]) {
      const itemExists = await sql`
        select 1
        from items i
        join wishlists w on w.id = i.wishlist_id
        where i.id = ${id} and w.owner_id = ${profile.id}
      `;

      if (!itemExists[0]) {
        return NextResponse.json({ error: "Item não encontrado ou sem permissão." }, { status: 404 });
      }

      return NextResponse.json(
        { error: "Apenas itens disponíveis podem entrar no próximo lugar livre do pódio." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível atualizar o pódio." },
      { status: 400 },
    );
  }
}
