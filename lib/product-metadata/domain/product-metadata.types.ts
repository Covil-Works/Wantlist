export type MetadataField = "title" | "description" | "imageUrl" | "canonicalUrl";

export type ProductMetadataSource = "url-parser" | "open-graph" | "manual";

export type ProductMetadata = {
  title?: string;
  description?: string;
  imageUrl?: string;
  canonicalUrl?: string;
  resolvedUrl?: string;
  originalUrl?: string;
  storeId?: string;
  source?: ProductMetadataSource;
  strategyId?: string;
};

export type ExtractionStatus =
  | "success"
  | "partial"
  | "not_found"
  | "timeout"
  | "invalid_url"
  | "redirect_failed"
  | "error";

export type DiagnosticStatus =
  | "success"
  | "partial"
  | "failed"
  | "timeout"
  | "blocked"
  | "invalid_response"
  | "invalid_url"
  | "redirect_failed"
  | "skipped";

export type ExtractionAttempt = {
  strategyId: string;
  success: boolean;
  durationMs: number;
  statusCode?: number;
  redirected?: boolean;
  foundFields: MetadataField[];
  errorCode?: string;
  errorMessage?: string;
  status: DiagnosticStatus;
};

export type ExtractionContext = {
  originalUrl: string;
  url: URL;
  resolvedUrl?: string;
  storeId?: string;
  signal?: AbortSignal;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
};

export type StrategyResult = {
  metadata: Partial<ProductMetadata>;
  attempt: ExtractionAttempt;
};

export type ProductMetadataStrategy = {
  id: string;
  extract(context: ExtractionContext): Promise<StrategyResult>;
};

export type UrlTitleParser = {
  id: string;
  parse(url: URL): string | null;
};

export type StoreExtractorConfig = {
  id: string;
  label: string;
  hostnames: string[];
  shortHostnames?: string[];
  urlTitleParser?: UrlTitleParser;
  openGraphStrategies: string[];
};

export type ExtractProductMetadataResult = {
  status: ExtractionStatus;
  data: ProductMetadata;
  attempts: ExtractionAttempt[];
  skippedStrategies: string[];
  fieldSources: Partial<Record<MetadataField, ProductMetadataSource | string>>;
  urlType: "normal" | "shortened";
  durationMs: number;
  cacheHit?: boolean;
  errorCode?: string;
};

export type StoreTestCase = {
  id: string;
  label: string;
  url: string;
  urlType: "normal" | "shortened";
  expectedStoreId: string;
  expectedUrlTitle?: string;
  expectedFields: Record<MetadataField, "required" | "optional" | "not-expected">;
};
