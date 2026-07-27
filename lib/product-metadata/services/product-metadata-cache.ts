import { PRODUCT_METADATA_CACHE_TTL_MS } from "../config";
import type { ExtractProductMetadataResult } from "../domain/product-metadata.types";

const cache = new Map<string, { expiresAt: number; value: ExtractProductMetadataResult }>();

export function getCachedProductMetadata(key: string, now = Date.now()) {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= now) {
    cache.delete(key);
    return null;
  }
  return { ...entry.value, cacheHit: true };
}

export function setCachedProductMetadata(key: string, value: ExtractProductMetadataResult, ttlMs = PRODUCT_METADATA_CACHE_TTL_MS, now = Date.now()) {
  if (value.status === "not_found" || value.status === "invalid_url" || value.status === "redirect_failed") return;
  cache.set(key, { expiresAt: now + ttlMs, value });
}

export function clearProductMetadataCache() {
  cache.clear();
}
