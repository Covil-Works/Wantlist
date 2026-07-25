import { headers } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { sql } from "@/lib/db";
import type { Profile } from "@/lib/types";

export async function getBearerToken() {
  const header = (await headers()).get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export async function requireFirebaseUid() {
  const token = await getBearerToken();
  if (!token) throw new Response("Não autenticado", { status: 401 });
  const decoded = await adminAuth().verifyIdToken(token);
  return decoded.uid;
}

export async function getOptionalProfile(): Promise<Profile | null> {
  const token = await getBearerToken();
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    const rows = await sql`select * from profiles where firebase_uid = ${decoded.uid} limit 1`;
    return (rows[0] as Profile) || null;
  } catch {
    return null;
  }
}

export async function requireProfile(): Promise<Profile> {
  const uid = await requireFirebaseUid();
  const rows = await sql`select * from profiles where firebase_uid = ${uid} limit 1`;
  const profile = rows[0] as Profile | undefined;
  if (!profile) throw new Response("Perfil incompleto", { status: 403 });
  return profile;
}
