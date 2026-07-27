import type { ExtractionContext, ProductMetadataStrategy, StrategyResult } from "../../domain/product-metadata.types";
import { foundFields, runOpenGraphScraper } from "./open-graph-adapter";

function classifyError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") return "timeout";
  const message = error instanceof Error ? error.message : String(error);
  if (/403|forbidden/i.test(message)) return "blocked";
  if (/404/i.test(message)) return "not_found";
  if (/429/i.test(message)) return "blocked";
  if (/timeout|aborted/i.test(message)) return "timeout";
  if (/html|content-type/i.test(message)) return "invalid_response";
  return "error";
}

export function createOpenGraphStrategy(id: string, headers: Record<string, string>): ProductMetadataStrategy {
  return {
    id,
    async extract(context: ExtractionContext): Promise<StrategyResult> {
      const startedAt = Date.now();
      try {
        const result = await runOpenGraphScraper({
          url: context.url.toString(),
          headers,
          signal: context.signal,
          timeoutMs: context.timeoutMs
        });
        const fields = foundFields(result.metadata);
        return {
          metadata: {
            ...result.metadata,
            originalUrl: context.originalUrl,
            resolvedUrl: context.resolvedUrl,
            storeId: context.storeId,
            source: "open-graph",
            strategyId: id
          },
          attempt: {
            strategyId: id,
            success: fields.length > 0,
            durationMs: Date.now() - startedAt,
            statusCode: result.statusCode,
            foundFields: fields,
            status: fields.length > 0 ? (fields.length >= 3 ? "success" : "partial") : "failed"
          }
        };
      } catch (error) {
        const code = classifyError(error);
        return {
          metadata: {},
          attempt: {
            strategyId: id,
            success: false,
            durationMs: Date.now() - startedAt,
            foundFields: [],
            errorCode: code,
            errorMessage: error instanceof Error ? error.message : String(error),
            status: code === "timeout" ? "timeout" : code === "blocked" ? "blocked" : code === "invalid_response" ? "invalid_response" : "failed"
          }
        };
      }
    }
  };
}
