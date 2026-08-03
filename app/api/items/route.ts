import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireProfile } from "@/lib/auth";
import { domainFromUrl, itemSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const profile = await requireProfile();
    const body = itemSchema.parse(await request.json());
    const wishlists = await sql`select * from wishlists where owner_id = ${profile.id} limit 1`;
    const wishlist = wishlists[0];
    if (!wishlist) return NextResponse.json({ error: "Crie uma wishlist primeiro." }, { status: 400 });
    const duplicate = body.originalUrl
      ? await sql`select id from items where wishlist_id = ${wishlist.id} and original_url = ${body.originalUrl} limit 1`
      : [];
    const rows = await sql`
      with next_revision as (
        update wishlists
        set items_revision = items_revision + 1, updated_at = now()
        where id = ${wishlist.id}
        returning id, items_revision
      ), new_item as (
        insert into items (wishlist_id, name, description, image_url, original_url, domain, created_revision)
        select next_revision.id, ${body.name}, ${body.description || null}, ${body.originalUrl ? body.imageUrl || null : null},
          ${body.originalUrl}, ${domainFromUrl(body.originalUrl)}, next_revision.items_revision
        from next_revision
        returning *
      ), notification_recipients as (
        select f.user_id
        from followers f
        join new_item on new_item.wishlist_id = f.wishlist_id
        union
        select ga.user_id
        from guest_accesses ga
        join new_item on new_item.wishlist_id = ga.wishlist_id
        where ga.status = 'active'
      ), notified_followers as (
        insert into notifications (recipient_id, wishlist_id, item_id, item_revision, type)
        select notification_recipients.user_id, new_item.wishlist_id, new_item.id, new_item.created_revision, 'new_items'
        from notification_recipients
        cross join new_item
        on conflict (recipient_id, wishlist_id, type)
          where read_at is null and type = 'new_items'
        do update set created_at = excluded.created_at, item_id = excluded.item_id, item_revision = excluded.item_revision
        returning id
      )
      select new_item.* from new_item
    `;
    return NextResponse.json({ item: rows[0], duplicate: duplicate.length > 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar item.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
