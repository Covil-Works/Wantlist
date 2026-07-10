import { sql } from "@/lib/db";
import type { Profile, Wishlist } from "@/lib/types";

export async function canViewWishlist(wishlist: Wishlist, profile: Profile | null) {
  if (profile?.id === wishlist.owner_id) return true;
  if (wishlist.visibility === "public") return true;
  if (!profile) return false;
  if (wishlist.visibility === "private") return false;
  const access = await sql`
    select 1 from guest_accesses
    where wishlist_id = ${wishlist.id} and user_id = ${profile.id} and status = 'active'
    limit 1
  `;
  return access.length > 0;
}
