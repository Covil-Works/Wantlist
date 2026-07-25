import type { StoreExtractorConfig } from "../domain/product-metadata.types";
import { GENERIC_STORE_CONFIG, STORE_CONFIGS } from "./store-config";

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/\.$/, "");
}

function matchesHostname(hostname: string, allowed: string[]) {
  const normalized = normalizeHostname(hostname);
  return allowed.some((candidate) => normalized === normalizeHostname(candidate));
}

export function resolveStoreByHostname(hostname: string): StoreExtractorConfig {
  return STORE_CONFIGS.find((store) => matchesHostname(hostname, store.hostnames)) ?? GENERIC_STORE_CONFIG;
}

export function resolveStoreByShortHostname(hostname: string): StoreExtractorConfig | null {
  return STORE_CONFIGS.find((store) => matchesHostname(hostname, store.shortHostnames ?? [])) ?? null;
}

export function getStoreById(storeId: string): StoreExtractorConfig | null {
  return STORE_CONFIGS.find((store) => store.id === storeId) ?? (storeId === GENERIC_STORE_CONFIG.id ? GENERIC_STORE_CONFIG : null);
}

export function getAllStores() {
  return STORE_CONFIGS;
}

export function isKnownShortHostname(hostname: string) {
  return resolveStoreByShortHostname(hostname) !== null;
}
