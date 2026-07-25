import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireProfile } from "@/lib/auth";
import { canViewWishlist } from "@/lib/permissions";
import type { Wishlist } from "@/lib/types";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const rows = await sql`select w.* from items i join wishlists w on w.id = i.wishlist_id where i.id = ${id} limit 1`;
  const wishlist = rows[0] as Wishlist | undefined;
  if (!wishlist || !(await canViewWishlist(wishlist, profile))) return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  if (wishlist.owner_id === profile.id) return NextResponse.json({ error: "O dono não pode reservar a própria wishlist." }, { status: 403 });
  try {
    await sql`insert into reservations (item_id, user_id) values (${id}, ${profile.id})`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Item já reservado." }, { status: 409 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const rows = await sql`
    select w.owner_id, r.user_id from items i
    join wishlists w on w.id = i.wishlist_id
    join reservations r on r.item_id = i.id
    where i.id = ${id} limit 1
  `;
  const reservation = rows[0];
  if (!reservation) return NextResponse.json({ ok: true });
  if (reservation.owner_id !== profile.id && reservation.user_id !== profile.id) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  await sql`delete from reservations where item_id = ${id}`;
  return NextResponse.json({ ok: true });
}
