import type { UrlTitleParser } from "../domain/product-metadata.types";

export const MAX_PRODUCT_NAME_LENGTH = 140;

export function pathSegmentAfter(url: URL, marker: string) {
  const segments = url.pathname.split("/").filter(Boolean);
  const markerIndex = segments.findIndex((segment) => segment.toLowerCase() === marker);
  return markerIndex >= 0 ? segments[markerIndex + 1] || null : null;
}

export function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function truncateName(name: string) {
  if (name.length <= MAX_PRODUCT_NAME_LENGTH) return name;
  const slice = name.slice(0, MAX_PRODUCT_NAME_LENGTH - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 80 ? lastSpace : slice.length).trimEnd()}...`;
}

export function humanizeSlug(slug: string) {
  const name = decodeSlug(slug)
    .replace(/\.html?$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!name || /^\d+$/.test(name)) return null;
  return truncateName(name.charAt(0).toUpperCase() + name.slice(1));
}

export function createSlugParser(id: string, selectSlug: (url: URL) => string | null | undefined): UrlTitleParser {
  return {
    id,
    parse(url) {
      const slug = selectSlug(url);
      return slug ? humanizeSlug(slug) : null;
    }
  };
}
