import fs from "node:fs/promises";
import path from "node:path";
import type { DiagnosticStatus, MetadataField, StoreTestCase, StrategyResult } from "../domain/product-metadata.types";
import { extractProductMetadata } from "./product-metadata-extractor";
import { sanitizeUrlForReport } from "./normalize-product-url";
import { getAllStoreTestCases, STORE_TEST_CASES } from "../fixtures/product-metadata";
import { getAllProductMetadataStrategies, PRODUCT_METADATA_STRATEGIES } from "../strategies/product-metadata-strategy-registry";
import { normalizeProductUrl } from "./normalize-product-url";
import { resolveStoreByHostname, resolveStoreByShortHostname } from "../stores/store-registry";

const FIELDS: MetadataField[] = ["title", "description", "imageUrl", "canonicalUrl"];

export type ProductMetadataDiagnosticReport = {
  executedAt: string;
  summary: Record<string, number>;
  cases: Array<{
    id: string;
    storeId: string;
    urlType: string;
    url: string;
    finalStatus: string;
    fields: Record<MetadataField, boolean>;
    fieldSources: Record<string, unknown>;
    strategies: Array<{ strategyId: string; status: DiagnosticStatus; durationMs: number; foundFields: MetadataField[]; statusCode?: number; errorCode?: string }>;
  }>;
  strategies: Array<{
    strategyId: string;
    storesTested: number;
    fullSuccess: number;
    partialSuccess: number;
    failed: number;
    timeouts: number;
    fields: Record<MetadataField, string>;
    ineffective: boolean;
  }>;
  comparison?: { regressions: string[]; improvements: string[] };
};

function statusFromFields(found: MetadataField[], expected: StoreTestCase["expectedFields"]): DiagnosticStatus {
  const required = FIELDS.filter((field) => expected[field] === "required");
  if (required.every((field) => found.includes(field))) return "success";
  if (found.length > 0) return "partial";
  return "failed";
}

async function runStrategyForCase(strategyId: string, testCase: StoreTestCase): Promise<StrategyResult> {
  const normalized = normalizeProductUrl(testCase.url);
  if (!normalized.ok) {
    return {
      metadata: {},
      attempt: { strategyId, success: false, durationMs: 0, foundFields: [], status: "invalid_url", errorCode: normalized.errorCode }
    };
  }
  const shortStore = resolveStoreByShortHostname(normalized.url.hostname);
  const store = shortStore ?? resolveStoreByHostname(normalized.url.hostname);
  const strategy = PRODUCT_METADATA_STRATEGIES[strategyId];
  if (!strategy) {
    return {
      metadata: {},
      attempt: { strategyId, success: false, durationMs: 0, foundFields: [], status: "skipped", errorCode: "strategy_missing" }
    };
  }
  return strategy.extract({
    originalUrl: normalized.normalizedUrl,
    url: normalized.url,
    storeId: store.id,
    timeoutMs: 1800,
    signal: AbortSignal.timeout(1800)
  });
}

function summarizeStrategies(report: ProductMetadataDiagnosticReport) {
  return getAllProductMetadataStrategies().map((strategy) => {
    const attempts = report.cases.flatMap((entry) => entry.strategies.filter((attempt) => attempt.strategyId === strategy.id));
    const fullSuccess = attempts.filter((attempt) => attempt.status === "success").length;
    const partialSuccess = attempts.filter((attempt) => attempt.status === "partial").length;
    const failed = attempts.filter((attempt) => attempt.status === "failed" || attempt.status === "blocked" || attempt.status === "invalid_response").length;
    const timeouts = attempts.filter((attempt) => attempt.status === "timeout").length;
    const fields = Object.fromEntries(FIELDS.map((field) => [field, `${attempts.filter((attempt) => attempt.foundFields.includes(field)).length}/${attempts.length}`])) as Record<MetadataField, string>;
    return { strategyId: strategy.id, storesTested: attempts.length, fullSuccess, partialSuccess, failed, timeouts, fields, ineffective: attempts.length > 0 && attempts.every((attempt) => attempt.foundFields.length === 0) };
  });
}

export async function runProductMetadataDiagnostics(filters: { store?: string; strategy?: string; field?: MetadataField; shortLinksOnly?: boolean } = {}) {
  const selectedCases = (filters.store ? STORE_TEST_CASES[filters.store] ?? [] : getAllStoreTestCases()).filter((testCase) => !filters.shortLinksOnly || testCase.urlType === "shortened");
  const strategies = getAllProductMetadataStrategies().filter((strategy) => !filters.strategy || strategy.id === filters.strategy);
  const report: ProductMetadataDiagnosticReport = {
    executedAt: new Date().toISOString(),
    summary: { stores: new Set(selectedCases.map((testCase) => testCase.expectedStoreId)).size, cases: selectedCases.length, strategies: strategies.length, fullSuccess: 0, partialSuccess: 0, failed: 0 },
    cases: [],
    strategies: []
  };

  for (const testCase of selectedCases) {
    const strategyAttempts = [];
    for (const strategy of strategies) {
      const result = await runStrategyForCase(strategy.id, testCase);
      const status = statusFromFields(result.attempt.foundFields, testCase.expectedFields);
      strategyAttempts.push({ ...result.attempt, status });
    }
    const full = await extractProductMetadata(testCase.url, { useCache: false });
    const fields = Object.fromEntries(FIELDS.map((field) => [field, Boolean(full.data[field])])) as Record<MetadataField, boolean>;
    if (filters.field && !fields[filters.field]) {
      // Keep the case in JSON; the terminal renderer highlights missing fields.
    }
    report.cases.push({
      id: testCase.id,
      storeId: full.data.storeId ?? testCase.expectedStoreId,
      urlType: testCase.urlType,
      url: sanitizeUrlForReport(testCase.url) ?? "[invalid-url]",
      finalStatus: full.status,
      fields,
      fieldSources: full.fieldSources,
      strategies: strategyAttempts
    });
  }

  report.summary.fullSuccess = report.cases.filter((entry) => entry.finalStatus === "success").length;
  report.summary.partialSuccess = report.cases.filter((entry) => entry.finalStatus === "partial").length;
  report.summary.failed = report.cases.filter((entry) => entry.finalStatus === "not_found" || entry.finalStatus === "error").length;
  report.strategies = summarizeStrategies(report);
  return report;
}

export async function writeDiagnosticReport(report: ProductMetadataDiagnosticReport, outputDir = "reports/product-metadata") {
  await fs.mkdir(outputDir, { recursive: true });
  const latestPath = path.join(outputDir, "latest.json");
  let previous: ProductMetadataDiagnosticReport | null = null;
  try {
    previous = JSON.parse(await fs.readFile(latestPath, "utf8"));
  } catch {
    previous = null;
  }
  if (previous) report.comparison = compareReports(previous, report);
  await fs.writeFile(latestPath, JSON.stringify(report, null, 2), "utf8");
  return latestPath;
}

export function compareReports(previous: ProductMetadataDiagnosticReport, current: ProductMetadataDiagnosticReport) {
  const regressions: string[] = [];
  const improvements: string[] = [];
  for (const currentCase of current.cases) {
    const previousCase = previous.cases.find((entry) => entry.id === currentCase.id);
    if (!previousCase) continue;
    for (const field of FIELDS) {
      if (previousCase.fields[field] && !currentCase.fields[field]) regressions.push(`${currentCase.id} / ${field}: found -> not found`);
      if (!previousCase.fields[field] && currentCase.fields[field]) improvements.push(`${currentCase.id} / ${field}: not found -> found`);
    }
  }
  return { regressions, improvements };
}
