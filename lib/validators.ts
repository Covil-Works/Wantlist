import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,40}$/, "Use 3 a 40 caracteres: letras, numeros, ponto, hifen ou sublinhado.");

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  username: usernameSchema
});

export const wishlistSchema = z.object({
  title: z.string().trim().min(2).max(100),
  visibility: z.enum(["public", "invited", "private"])
});

export const itemSchema = z.object({
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().max(700).optional().nullable(),
  imageUrl: z.string().trim().url().max(1000).optional().nullable().or(z.literal("")),
  originalUrl: z.string().trim().url().max(1000)
});

export function domainFromUrl(url: string) {
  const parsed = new URL(url);
  return parsed.hostname.replace(/^www\./, "").slice(0, 180);
}
