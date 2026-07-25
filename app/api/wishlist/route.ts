import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireProfile } from "@/lib/auth";
import { randomCode } from "@/lib/random";
import { deleteWishlistSchema, wishlistSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const profile = await requireProfile();
    const body = wishlistSchema.parse(await request.json());
    for (let i = 0; i < 5; i++) {
      try {
        const rows = await sql`
          insert into wishlists (owner_id, title, visibility, public_code)
          values (${profile.id}, ${body.title}, ${body.visibility}, ${randomCode()})
          returning *
        `;
        return NextResponse.json({ wishlist: rows[0] });
      } catch (error) {
        if (String(error).includes("owner_id")) throw error;
      }
    }
    throw new Error("Não foi possível gerar um código único.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar wishlist.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireProfile();
    const body = wishlistSchema.parse(await request.json());
    const rows = await sql`
      update wishlists set title = ${body.title}, visibility = ${body.visibility}, updated_at = now()
      where owner_id = ${profile.id}
      returning *
    `;
    return NextResponse.json({ wishlist: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível atualizar.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await requireProfile();
    const body = deleteWishlistSchema.parse(await request.json());
    const rows = await sql`
      delete from wishlists
      where owner_id = ${profile.id} and title = ${body.title}
      returning id
    `;
    if (!rows[0]) {
      return NextResponse.json({ error: "Lista não encontrada ou nome diferente." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível apagar a lista.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
