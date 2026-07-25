import { PRODUCT_METADATA_MAX_REDIRECTS, PRODUCT_METADATA_REDIRECT_TIMEOUT_MS } from "../config";
import { normalizeProductUrl } from "../services/normalize-product-url";
import { validateExternalUrl } from "../validation/validate-external-url";

export type ShortLinkResolution =
  | { ok: true; finalUrl: URL; redirected: boolean; durationMs: number; redirectCount: number; statusCode?: number }
  | { ok: false; errorCode: string; durationMs: number; redirectCount: number; statusCode?: number };

function composeSignals(signals: AbortSignal[]) {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) controller.abort(signal.reason);
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

export async function resolveShortLink(
  inputUrl: URL,
  options: { fetchImpl?: typeof fetch; signal?: AbortSignal; timeoutMs?: number; maxRedirects?: number; validateUrl?: typeof validateExternalUrl } = {}
): Promise<ShortLinkResolution> {
  const startedAt = Date.now();
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxRedirects = options.maxRedirects ?? PRODUCT_METADATA_MAX_REDIRECTS;
  const timeoutSignal = AbortSignal.timeout(options.timeoutMs ?? PRODUCT_METADATA_REDIRECT_TIMEOUT_MS);
  const signal = options.signal ? composeSignals([options.signal, timeoutSignal]) : timeoutSignal;
  let current = inputUrl;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    const validation = await (options.validateUrl ?? validateExternalUrl)(current);
    if (!validation.ok) return { ok: false, errorCode: validation.errorCode, durationMs: Date.now() - startedAt, redirectCount };

    let response: Response;
    try {
      response = await fetchImpl(current, { method: "HEAD", redirect: "manual", signal });
    } catch (error) {
      return {
        ok: false,
        errorCode: error instanceof DOMException && error.name === "AbortError" ? "timeout" : "redirect_failed",
        durationMs: Date.now() - startedAt,
        redirectCount
      };
    }

    const statusCode = response.status;
    if (![301, 302, 303, 307, 308].includes(statusCode)) {
      return { ok: true, finalUrl: current, redirected: redirectCount > 0, durationMs: Date.now() - startedAt, redirectCount, statusCode };
    }

    const location = response.headers.get("location");
    if (!location) return { ok: false, errorCode: "missing_location", durationMs: Date.now() - startedAt, redirectCount, statusCode };
    const next = normalizeProductUrl(new URL(location, current).toString());
    if (!next.ok) return { ok: false, errorCode: next.errorCode, durationMs: Date.now() - startedAt, redirectCount, statusCode };
    current = next.url;
  }

  return { ok: false, errorCode: "too_many_redirects", durationMs: Date.now() - startedAt, redirectCount: maxRedirects };
}
