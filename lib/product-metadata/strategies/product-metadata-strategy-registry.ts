import type { ProductMetadataStrategy } from "../domain/product-metadata.types";
import { createOpenGraphStrategy } from "./open-graph/create-open-graph-strategy";
import { REQUEST_HEADER_PRESETS } from "./open-graph/header-presets";

export const PRODUCT_METADATA_STRATEGIES: Record<string, ProductMetadataStrategy> = {
  DEFAULT: createOpenGraphStrategy("DEFAULT", REQUEST_HEADER_PRESETS.DEFAULT),
  BROWSER: createOpenGraphStrategy("BROWSER", REQUEST_HEADER_PRESETS.BROWSER),
  SOCIAL_FACEBOOK: createOpenGraphStrategy("SOCIAL_FACEBOOK", REQUEST_HEADER_PRESETS.SOCIAL_FACEBOOK),
  SOCIAL_WHATSAPP: createOpenGraphStrategy("SOCIAL_WHATSAPP", REQUEST_HEADER_PRESETS.SOCIAL_WHATSAPP)
};

export function getProductMetadataStrategy(id: string, registry = PRODUCT_METADATA_STRATEGIES) {
  return registry[id] ?? null;
}

export function getAllProductMetadataStrategies(registry = PRODUCT_METADATA_STRATEGIES) {
  return Object.values(registry);
}
