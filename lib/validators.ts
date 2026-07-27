import { z } from "zod";
import { normalizeProductUrl } from "@/lib/product-metadata/services/normalize-product-url";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,40}$/, "Use 3 a 40 caracteres: letras, números, ponto, hífen ou sublinhado.");

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  username: usernameSchema
});

export const wishlistSchema = z.object({
  title: z.string().trim().min(2).max(100),
  visibility: z.enum(["public", "invited", "private"])
});

export const deleteWishlistSchema = z.object({
  title: z.string().trim().min(2).max(100)
});

export const itemSchema = z.object({
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().max(700).optional().nullable(),
  imageUrl: z.string().trim().url().max(1000).optional().nullable().or(z.literal("")),
  originalUrl: z.string().trim().max(1000).optional().nullable().transform((value, ctx) => {
    if (!value) return null;
    const normalized = normalizeProductUrl(value);
    if (!normalized.ok) {
      ctx.addIssue({ code: "custom", message: "Informe uma URL de produto válida." });
      return z.NEVER;
    }
    return normalized.normalizedUrl;
  })
});

export function domainFromUrl(url: string | null) {
  if (!url) return null;
  const parsed = new URL(url);
  return parsed.hostname.replace(/^www\./, "").slice(0, 180);
}
