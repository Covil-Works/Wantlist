import { normalizeProductUrl } from "@/lib/product-metadata/services/normalize-product-url";
import { isKnownShortHostname, resolveStoreByHostname } from "@/lib/product-metadata/stores/store-registry";

export function resolveProductName(input: string): string | null {
  const normalized = normalizeProductUrl(input);
  if (!normalized.ok) return null;
  if (isKnownShortHostname(normalized.url.hostname)) return null;
  const store = resolveStoreByHostname(normalized.url.hostname);
  return store.urlTitleParser?.parse(normalized.url) ?? null;
}
