import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { NotificationType } from "@/lib/types";

type NotificationRow = {
  id: string;
  type: NotificationType;
  created_at: string;
  read_at: string | null;
  item_id: string | null;
  title: string;
  public_code: string;
};

function presentNotification(row: NotificationRow) {
  const messages: Record<NotificationType, string> = {
    new_items: `Novos itens foram adicionados à lista ${row.title}, que você segue.`,
    item_reserved: `Alguém reservou um item da sua lista ${row.title}.`,
    podium_item_reserved: `Alguém reservou um item do pódio da sua lista ${row.title}. Você pode substituí-lo por outro item.`,
  };

  const itemTarget = row.item_id
    ? `${row.type === "new_items" ? `?novo=${row.item_id}` : ""}#wishlist-item-${row.item_id}`
    : "";

  return {
    id: row.id,
    type: row.type,
    message: messages[row.type],
    href: `/w/${row.public_code}${itemTarget}`,
    created_at: row.created_at,
    read_at: row.read_at,
  };
}

export async function GET(request: Request) {
  const profile = await requireProfile();
  const requestedLimit = new URL(request.url).searchParams.get("limit");
  const limit = requestedLimit ? Math.min(Math.max(Number.parseInt(requestedLimit, 10) || 3, 1), 50) : null;
  const rows = limit
    ? await sql`
        select n.id, n.type, n.created_at, n.read_at,
          coalesce(n.item_id, (
            select i.id from items i
            where n.type = 'new_items' and i.wishlist_id = n.wishlist_id and i.created_at <= n.created_at
            order by i.created_at desc limit 1
          )) as item_id,
          w.title, w.public_code
        from notifications n
        join wishlists w on w.id = n.wishlist_id
        where n.recipient_id = ${profile.id}
        order by n.created_at desc
        limit ${limit}
      `
    : await sql`
        select n.id, n.type, n.created_at, n.read_at,
          coalesce(n.item_id, (
            select i.id from items i
            where n.type = 'new_items' and i.wishlist_id = n.wishlist_id and i.created_at <= n.created_at
            order by i.created_at desc limit 1
          )) as item_id,
          w.title, w.public_code
        from notifications n
        join wishlists w on w.id = n.wishlist_id
        where n.recipient_id = ${profile.id}
        order by n.created_at desc
      `;
  const counts = await sql`
    select count(*)::int as total,
      count(*) filter (where read_at is null)::int as unread_count
    from notifications
    where recipient_id = ${profile.id}
  `;

  return NextResponse.json({
    notifications: (rows as NotificationRow[]).map(presentNotification),
    total: counts[0]?.total || 0,
    unreadCount: counts[0]?.unread_count || 0,
  });
}

export async function PATCH() {
  const profile = await requireProfile();
  await sql`
    update notifications
    set read_at = now()
    where recipient_id = ${profile.id} and read_at is null
  `;
  return NextResponse.json({ ok: true });
}
