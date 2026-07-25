const TRACKING_PARAMS = [/^utm_/i, /^fbclid$/i, /^gclid$/i, /^msclkid$/i];

export type NormalizedProductUrl =
  | { ok: true; url: URL; normalizedUrl: string }
  | { ok: false; errorCode: "invalid_url" | "invalid_protocol" };

export function normalizeProductUrl(input: string): NormalizedProductUrl {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { ok: false, errorCode: "invalid_url" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false, errorCode: "invalid_protocol" };
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";

  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.some((pattern) => pattern.test(key))) url.searchParams.delete(key);
  }

  return { ok: true, url, normalizedUrl: url.toString() };
}

export function sanitizeUrlForReport(input?: string) {
  if (!input) return undefined;
  try {
    const url = new URL(input);
    url.username = "";
    url.password = "";
    url.search = url.searchParams.size ? "?..." : "";
    url.hash = "";
    return url.toString();
  } catch {
    return "[invalid-url]";
  }
}
