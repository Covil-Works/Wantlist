import { PRODUCT_METADATA_STRATEGY_TIMEOUT_MS, PRODUCT_METADATA_TIMEOUT_MS } from "../config";
import type {
  ExtractProductMetadataResult,
  ExtractionAttempt,
  MetadataField,
  ProductMetadata,
  ProductMetadataStrategy
} from "../domain/product-metadata.types";
import { resolveShortLink } from "../short-links/short-link-resolver";
import { normalizeProductUrl } from "./normalize-product-url";
import { getCachedProductMetadata, setCachedProductMetadata } from "./product-metadata-cache";
import { getProductMetadataStrategy, PRODUCT_METADATA_STRATEGIES } from "../strategies/product-metadata-strategy-registry";
import { isKnownShortHostname } from "../stores/store-registry";
import { resolveStoreByHostname, resolveStoreByShortHostname } from "../stores/store-registry";
import { validateExternalUrl } from "../validation/validate-external-url";

const MERGE_FIELDS: MetadataField[] = ["title", "description", "imageUrl", "canonicalUrl"];

function composeSignals(signals: AbortSignal[]) {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) controller.abort(signal.reason);
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}
const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  quot: '"',
  nbsp: " ",
  lt: "<",
  gt: ">",
  aacute: "á",
  agrave: "à",
  acirc: "â",
  atilde: "ã",
  ccedil: "ç",
  eacute: "é",
  ecirc: "ê",
  iacute: "í",
  oacute: "ó",
  ocirc: "ô",
  otilde: "õ",
  uacute: "ú",
  Aacute: "Á",
  Agrave: "À",
  Acirc: "Â",
  Atilde: "Ã",
  Ccedil: "Ç",
  Eacute: "É",
  Ecirc: "Ê",
  Iacute: "Í",
  Oacute: "Ó",
  Ocirc: "Ô",
  Otilde: "Õ",
  Uacute: "Ú"
};

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return HTML_ENTITIES[code] ?? entity;
  });
}

function normalizeText(value: string) {
  return decodeHtmlEntities(value)
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeTitle(title: string, storeId?: string) {
  const normalized = normalizeText(title)
    .replace(/^[-|:]+\s*/, "")
    .replace(/\s+\|\s+Amazon\.com\.br$/i, "")
    .trim();

  if (!normalized || normalized === "Amazon.com.br") return undefined;
  if (storeId === "sephora" && normalized.includes("�")) return undefined;
  return normalized;
}

function sanitizeDescription(description: string, storeId?: string) {
  const normalized = normalizeText(description);
  if (!normalized) return undefined;
  if (storeId === "shein" && /De sapatos a roupas.*podem ser encontradas online em SHEIN/i.test(normalized)) return undefined;
  if (storeId === "amazon" && /^Compre online .+ na Amazon\./i.test(normalized)) return undefined;
  return normalized;
}

function sanitizeMetadataForStore(incoming: Partial<ProductMetadata>, storeId?: string): Partial<ProductMetadata> {
  return {
    ...incoming,
    ...(incoming.title ? { title: sanitizeTitle(incoming.title, storeId) } : {}),
    ...(incoming.description ? { description: sanitizeDescription(incoming.description, storeId) } : {})
  };
}

function mergeMetadata(
  target: ProductMetadata,
  incoming: Partial<ProductMetadata>,
  fieldSources: ExtractProductMetadataResult["fieldSources"],
  source: string,
  storeId?: string
) {
  const sanitized = sanitizeMetadataForStore(incoming, storeId);

  for (const field of MERGE_FIELDS) {
    if (!target[field] && sanitized[field]) {
      target[field] = sanitized[field] as string;
      fieldSources[field] = source;
    }
  }
  if (sanitized.resolvedUrl && !target.resolvedUrl) target.resolvedUrl = sanitized.resolvedUrl;
  if (sanitized.canonicalUrl && !target.canonicalUrl) target.canonicalUrl = sanitized.canonicalUrl;
  if (sanitized.storeId && !target.storeId) target.storeId = sanitized.storeId;
}

function classifyFinalStatus(data: ProductMetadata, attempts: ExtractionAttempt[], timedOut: boolean): ExtractProductMetadataResult["status"] {
  if (timedOut) return "timeout";
  const foundCount = MERGE_FIELDS.filter((field) => Boolean(data[field])).length;
  if (foundCount >= 3) return "success";
  if (foundCount > 0) return "partial";
  if (attempts.some((attempt) => attempt.status === "timeout")) return "timeout";
  return "not_found";
}

export async function extractProductMetadata(
  input: string,
  options: {
    timeoutMs?: number;
    strategyTimeoutMs?: number;
    fetchImpl?: typeof fetch;
    signal?: AbortSignal;
    useCache?: boolean;
    strategyRegistry?: Record<string, ProductMetadataStrategy>;
    validateUrl?: typeof validateExternalUrl;
  } = {}
): Promise<ExtractProductMetadataResult> {
  const startedAt = Date.now();
  const timeoutMs = options.timeoutMs ?? PRODUCT_METADATA_TIMEOUT_MS;
  const strategyTimeoutMs = options.strategyTimeoutMs ?? PRODUCT_METADATA_STRATEGY_TIMEOUT_MS;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = options.signal ? composeSignals([options.signal, timeoutSignal]) : timeoutSignal;
  const attempts: ExtractionAttempt[] = [];
  const skippedStrategies: string[] = [];
  const fieldSources: ExtractProductMetadataResult["fieldSources"] = {};

  const normalized = normalizeProductUrl(input);
  if (!normalized.ok) {
    return { status: "invalid_url", data: {}, attempts, skippedStrategies, fieldSources, urlType: "normal", durationMs: Date.now() - startedAt, errorCode: normalized.errorCode };
  }

  const cacheKey = normalized.normalizedUrl;
  if (options.useCache !== false) {
    const cached = getCachedProductMetadata(cacheKey);
    if (cached) return cached;
  }

  const originalUrl = normalized.normalizedUrl;
  const originalStore = resolveStoreByHostname(normalized.url.hostname);
  const shortStore = resolveStoreByShortHostname(normalized.url.hostname);
  const urlType = shortStore ? "shortened" : "normal";
  let finalUrl = normalized.url;
  let store = shortStore ?? originalStore;
  const data: ProductMetadata = {
    originalUrl,
    resolvedUrl: normalized.url.toString(),
    storeId: store.id
  };

  if (store.urlTitleParser && urlType === "normal") {
    const title = store.urlTitleParser.parse(normalized.url);
    if (title) mergeMetadata(data, { title, source: "url-parser" }, fieldSources, "url-parser", store.id);
  }

  const validateUrl = options.validateUrl ?? validateExternalUrl;
  const originalValidation = await validateUrl(normalized.url);
  if (!originalValidation.ok) {
    return { status: "invalid_url", data, attempts, skippedStrategies, fieldSources, urlType, durationMs: Date.now() - startedAt, errorCode: originalValidation.errorCode };
  }

  if (urlType === "shortened") {
    const resolution = await resolveShortLink(normalized.url, { fetchImpl: options.fetchImpl, signal, validateUrl });
    if (!resolution.ok) {
      return { status: "redirect_failed", data, attempts, skippedStrategies, fieldSources, urlType, durationMs: Date.now() - startedAt, errorCode: resolution.errorCode };
    }
    finalUrl = resolution.finalUrl;
    store = resolveStoreByHostname(finalUrl.hostname);
    if (store.id === "generic") store = shortStore ?? store;
    data.resolvedUrl = finalUrl.toString();
    data.storeId = store.id;

    const finalValidation = await validateUrl(finalUrl);
    if (!finalValidation.ok) {
      return { status: "invalid_url", data, attempts, skippedStrategies, fieldSources, urlType, durationMs: Date.now() - startedAt, errorCode: finalValidation.errorCode };
    }

    if (store.urlTitleParser) {
      const title = store.urlTitleParser.parse(finalUrl);
      if (title) mergeMetadata(data, { title, source: "url-parser" }, fieldSources, "url-parser", store.id);
    }
  } else if (isKnownShortHostname(normalized.url.hostname)) {
    skippedStrategies.push("url-parser");
  }

  const registry = options.strategyRegistry ?? PRODUCT_METADATA_STRATEGIES;
  for (const strategyId of store.openGraphStrategies) {
    if (signal.aborted) break;
    if (MERGE_FIELDS.every((field) => Boolean(data[field]))) {
      skippedStrategies.push(...store.openGraphStrategies.slice(store.openGraphStrategies.indexOf(strategyId)));
      break;
    }
    const strategy = getProductMetadataStrategy(strategyId, registry);
    if (!strategy) {
      skippedStrategies.push(strategyId);
      continue;
    }
    const perStrategySignal = composeSignals([signal, AbortSignal.timeout(strategyTimeoutMs)]);
    const result = await strategy.extract({
      originalUrl,
      url: finalUrl,
      resolvedUrl: finalUrl.toString(),
      storeId: store.id,
      signal: perStrategySignal,
      timeoutMs: strategyTimeoutMs,
      fetchImpl: options.fetchImpl
    });
    attempts.push(result.attempt);
    mergeMetadata(data, result.metadata, fieldSources, strategy.id, store.id);
  }

  const result: ExtractProductMetadataResult = {
    status: classifyFinalStatus(data, attempts, signal.aborted),
    data,
    attempts,
    skippedStrategies,
    fieldSources,
    urlType,
    durationMs: Date.now() - startedAt
  };

  if (options.useCache !== false) setCachedProductMetadata(cacheKey, result);
  return result;
}

export function resolveProductNameFromRegisteredStores(input: string) {
  const normalized = normalizeProductUrl(input);
  if (!normalized.ok) return null;
  if (isKnownShortHostname(normalized.url.hostname)) return null;
  const store = resolveStoreByHostname(normalized.url.hostname);
  return store.urlTitleParser?.parse(normalized.url) ?? null;
}