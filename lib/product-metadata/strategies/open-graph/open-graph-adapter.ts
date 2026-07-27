import ogs from "open-graph-scraper";
import type { MetadataField, ProductMetadata } from "../../domain/product-metadata.types";

type UnknownRecord = Record<string, unknown>;

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function imageCandidateUrl(candidate: unknown, baseUrl: string) {
  if (!candidate) return undefined;
  if (typeof candidate === "string") return absoluteUrl(candidate, baseUrl);
  if (typeof candidate === "object") {
    const record = candidate as UnknownRecord;
    return absoluteUrl(firstString(record.url, record.secureUrl, record.secure_url, record.image, record.href), baseUrl);
  }
  return undefined;
}

function imageScore(url: string) {
  const lower = url.toLowerCase();
  if (/\.(svg|gif)(\?|$)/i.test(lower)) return -1;
  if (/sprite|nav-sprite|logo-|home-banners-site-app|trade-marketing|paginas_institucionais|lp-rappi|menu_/i.test(lower)) return -1;

  let score = 0;
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(lower)) score += 20;
  if (lower.includes("/images/i/")) score += 40;
  if (/_ac_s[rx]\d+|_sl\d+|_sx\d+|_sy\d+/i.test(url)) score += 20;
  if (/_ac_sr\d+,\d+/i.test(url)) score -= 30;
  return score;
}

function normalizeImageValue(value: unknown, baseUrl: string): string | undefined {
  const candidates = Array.isArray(value) ? value : [value];
  let best: { url: string; score: number } | null = null;

  for (const candidate of candidates) {
    const url = imageCandidateUrl(candidate, baseUrl);
    if (!url) continue;
    const score = imageScore(url);
    if (score < 0) continue;
    if (!best || score > best.score) best = { url, score };
  }

  return best?.url;
}

function absoluteUrl(value: string | undefined, baseUrl: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function normalizeOpenGraphResult(raw: UnknownRecord, pageUrl: string): Partial<ProductMetadata> {
  const title = firstString(raw.ogTitle, raw.twitterTitle, raw.dcTitle, raw.title);
  const description = firstString(raw.ogDescription, raw.twitterDescription, raw.dcDescription, raw.description);
  const imageUrl = normalizeImageValue(raw.ogImage ?? raw.twitterImage ?? raw.image, pageUrl);
  const canonicalUrl = absoluteUrl(firstString(raw.ogUrl, raw.requestUrl, raw.url), pageUrl);

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(canonicalUrl ? { canonicalUrl } : {})
  };
}

export function foundFields(metadata: Partial<ProductMetadata>): MetadataField[] {
  return (["title", "description", "imageUrl", "canonicalUrl"] as MetadataField[]).filter((field) => Boolean(metadata[field]));
}

export async function runOpenGraphScraper(options: {
  url: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs: number;
}) {
  const result = await ogs({
    url: options.url,
    timeout: Math.ceil(options.timeoutMs / 1000),
    fetchOptions: {
      signal: options.signal,
      headers: options.headers
    }
  });

  const raw = (result.result ?? {}) as UnknownRecord;
  return {
    metadata: normalizeOpenGraphResult(raw, options.url),
    statusCode: typeof raw.success === "boolean" && raw.success ? 200 : undefined,
    raw
  };
}
