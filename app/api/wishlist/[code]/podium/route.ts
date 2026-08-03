import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { getSql } from "@/lib/db";

const podiumOrderSchema = z.object({
  itemIds: z.array(z.string().uuid()).max(3).refine((ids) => new Set(ids).size === ids.length),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const profile = await requireProfile();
    const { code } = await params;
    const { itemIds } = podiumOrderSchema.parse(await request.json());
    const requestedItems = JSON.stringify(itemIds);
    const database = getSql();

    const results = await database.transaction((tx) => [
      tx`
        with requested_items as (
          select value::uuid as id
          from jsonb_array_elements_text(${requestedItems}::jsonb)
        ),
        valid_items as (
          select i.id
          from requested_items requested
          join items i on i.id = requested.id
          join wishlists w on w.id = i.wishlist_id
          left join reservations r on r.item_id = i.id
          where w.public_code = ${code}
            and w.owner_id = ${profile.id}
            and r.item_id is null
        )
        select 1 / ((
          (select count(*) from valid_items) = ${itemIds.length}
          and exists (
            select 1 from wishlists
            where public_code = ${code} and owner_id = ${profile.id}
          )
        )::int) as valid
      `,
      tx`
        update items
        set podium_position = null, updated_at = now()
        where wishlist_id = (
          select id from wishlists
          where public_code = ${code} and owner_id = ${profile.id}
        )
          and podium_position is not null
      `,
      ...itemIds.map((itemId, index) => tx`
        update items
        set podium_position = ${index + 1}, updated_at = now()
        where id = ${itemId}
          and wishlist_id = (
            select id from wishlists
            where public_code = ${code} and owner_id = ${profile.id}
          )
      `),
    ]);

    if (!results[0]?.[0]) {
      return NextResponse.json({ error: "Não foi possível validar a nova ordem do pódio." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível salvar a ordem do pódio." },
      { status: 400 },
    );
  }
}