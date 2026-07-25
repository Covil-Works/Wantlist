import { resolveProductNameFromRegisteredStores } from "@/lib/product-metadata/services/product-metadata-extractor";

export function resolveProductName(input: string): string | null {
  return resolveProductNameFromRegisteredStores(input);
}