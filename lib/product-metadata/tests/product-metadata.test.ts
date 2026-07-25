import assert from "node:assert/strict";
import test from "node:test";
import type { ProductMetadataStrategy } from "../domain/product-metadata.types";
import { CENTAURO_CASES } from "../fixtures/product-metadata/centauro";
import { STORE_TEST_CASES } from "../fixtures/product-metadata";
import { normalizeOpenGraphResult } from "../strategies/open-graph/open-graph-adapter";
import { REQUEST_HEADER_PRESETS } from "../strategies/open-graph/header-presets";
import { normalizeProductUrl } from "../services/normalize-product-url";
import { extractProductMetadata, resolveProductNameFromRegisteredStores } from "../services/product-metadata-extractor";
import { resolveShortLink } from "../short-links/short-link-resolver";
import { compareReports } from "../services/product-metadata-diagnostics";
import { isBlockedIp } from "../validation/validate-external-url";
import { getAllStores, resolveStoreByHostname, resolveStoreByShortHostname } from "../stores/store-registry";

const allowUrl = async () => ({ ok: true as const });

function strategy(id: string, metadata: Record<string, string> = {}, status = "partial"): ProductMetadataStrategy {
  return {
    id,
    async extract() {
      const foundFields = (["title", "description", "imageUrl", "canonicalUrl"] as const).filter((field) => Boolean(metadata[field]));
      return {
        metadata,
        attempt: { strategyId: id, success: foundFields.length > 0, durationMs: 1, foundFields: [...foundFields], status: status as any }
      };
    }
  };
}

test("normaliza URLs e remove apenas parâmetros de rastreamento", () => {
  const result = normalizeProductUrl(" HTTPS://Example.COM/produto?utm_source=x&cor=B7#frag ");
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.url.hostname, "example.com");
    assert.equal(result.url.searchParams.get("cor"), "B7");
    assert.equal(result.url.searchParams.has("utm_source"), false);
    assert.equal(result.url.hash, "");
  }
  assert.equal(normalizeProductUrl("ftp://example.com").ok, false);
  assert.equal(normalizeProductUrl("not a url").ok, false);
});

test("parser da Centauro extrai o mesmo nome nas duas URLs fornecidas", () => {
  for (const testCase of CENTAURO_CASES) {
    assert.equal(resolveProductNameFromRegisteredStores(testCase.url), "Camisa Brasil Nike I 2026/27 Torcedor Pro Masculina");
  }
});

test("parser da Amazon usa slug descritivo antes de segmentos técnicos", () => {
  assert.equal(
    resolveProductNameFromRegisteredStores("https://www.amazon.com.br/Echo-Dot-5%C2%AA-gera%C3%A7%C3%A3o-Cor-Preta/dp/B09B8V1LZ3"),
    "Echo Dot 5ª geração Cor Preta"
  );
  assert.equal(resolveProductNameFromRegisteredStores("https://www.amazon.com.br/dp/B09B8V1LZ3"), null);
});

test("orquestrador executa parser de URL antes de validação externa em loja catalogada", async () => {
  const result = await extractProductMetadata("https://www.amazon.com.br/Echo-Dot-5%C2%AA-gera%C3%A7%C3%A3o-Cor-Preta/dp/B09B8V1LZ3", {
    useCache: false,
    validateUrl: async () => ({ ok: false as const, errorCode: "dns_failed" })
  });

  assert.equal(result.status, "invalid_url");
  assert.equal(result.data.title, "Echo Dot 5ª geração Cor Preta");
  assert.equal(result.fieldSources.title, "url-parser");
});
test("resolve lojas e domínios encurtados cadastrados", () => {
  assert.equal(resolveStoreByHostname("www.centauro.com.br").id, "centauro");
  assert.equal(resolveStoreByHostname("centauro.com.br").id, "centauro");
  assert.equal(resolveStoreByHostname("www.amazon.com.br").id, "amazon");
  assert.equal(resolveStoreByShortHostname("a.co")?.id, "amazon");
  assert.equal(resolveStoreByHostname("www.mercadolivre.com.br").id, "mercado-livre");
  assert.equal(resolveStoreByShortHostname("meli.to")?.id, "mercado-livre");
  assert.equal(resolveStoreByHostname("evil-centauro.com.br").id, "generic");
});

test("cada loja cadastrada possui fixture próprio e parser esperado", () => {
  for (const store of getAllStores()) {
    const cases = STORE_TEST_CASES[store.id] ?? [];
    assert.ok(cases.length > 0, `loja sem fixture: ${store.id}`);
    for (const testCase of cases) {
      const hostname = new URL(testCase.url).hostname;
      if (testCase.urlType === "normal") assert.equal(resolveStoreByHostname(hostname).id, testCase.expectedStoreId);
      if (testCase.expectedUrlTitle) assert.equal(resolveProductNameFromRegisteredStores(testCase.url), testCase.expectedUrlTitle);
    }
  }
});
test("resolvedor de link curto preserva original e retorna URL final em redirecionamento controlado", async () => {
  let redirects = 0;
  const fetchImpl = async () => redirects++ === 0 ? new Response(null, { status: 302, headers: { location: "https://www.amazon.com.br/produto/dp/1" } }) : new Response(null, { status: 200 });
  const result = await resolveShortLink(new URL("https://a.co/test"), { fetchImpl: fetchImpl as any, validateUrl: allowUrl });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.finalUrl.hostname, "www.amazon.com.br");
    assert.equal(result.redirected, true);
  }
});

test("resolvedor bloqueia excesso de redirecionamentos", async () => {
  const fetchImpl = async () => new Response(null, { status: 302, headers: { location: "https://a.co/loop" } });
  const result = await resolveShortLink(new URL("https://a.co/test"), { fetchImpl: fetchImpl as any, validateUrl: allowUrl, maxRedirects: 1 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.errorCode, "too_many_redirects");
});

test("orquestrador preserva título do parser e complementa com Open Graph", async () => {
  const result = await extractProductMetadata(CENTAURO_CASES[0].url, {
    useCache: false,
    validateUrl: allowUrl,
    strategyRegistry: {
      BROWSER: strategy("BROWSER", { title: "Outro título", imageUrl: "https://cdn.example/image.jpg" }),
      DEFAULT: strategy("DEFAULT", { description: "Descrição do produto" }),
      SOCIAL_FACEBOOK: strategy("SOCIAL_FACEBOOK")
    }
  });
  assert.equal(result.data.title, "Camisa Brasil Nike I 2026/27 Torcedor Pro Masculina");
  assert.equal(result.data.imageUrl, "https://cdn.example/image.jpg");
  assert.equal(result.fieldSources.title, "url-parser");
  assert.equal(result.fieldSources.imageUrl, "BROWSER");
});

test("orquestrador retorna not_found quando todas as estratégias falham", async () => {
  const result = await extractProductMetadata("https://example.com/product/123", {
    useCache: false,
    validateUrl: allowUrl,
    strategyRegistry: { BROWSER: strategy("BROWSER"), DEFAULT: strategy("DEFAULT") }
  });
  assert.equal(result.status, "not_found");
});

test("adapter normaliza imagens string, objeto, lista e URL relativa", () => {
  assert.equal(normalizeOpenGraphResult({ ogImage: "/img.jpg" }, "https://example.com/p").imageUrl, "https://example.com/img.jpg");
  assert.equal(normalizeOpenGraphResult({ ogImage: [{ url: "https://cdn.example/a.png" }] }, "https://example.com/p").imageUrl, "https://cdn.example/a.png");
  assert.equal(normalizeOpenGraphResult({ twitterImage: { url: "/tw.png" } }, "https://example.com/p").imageUrl, "https://example.com/tw.png");
});

test("estratégias reais possuem headers identificáveis", () => {
  assert.match(REQUEST_HEADER_PRESETS.BROWSER["user-agent"], /Mozilla/);
  assert.match(REQUEST_HEADER_PRESETS.SOCIAL_FACEBOOK["user-agent"], /facebookexternalhit/);
  assert.match(REQUEST_HEADER_PRESETS.SOCIAL_WHATSAPP["user-agent"], /WhatsApp/);
});

test("segurança bloqueia endereços internos e metadata", () => {
  assert.equal(isBlockedIp("127.0.0.1"), true);
  assert.equal(isBlockedIp("10.1.2.3"), true);
  assert.equal(isBlockedIp("172.16.0.1"), true);
  assert.equal(isBlockedIp("192.168.0.1"), true);
  assert.equal(isBlockedIp("169.254.169.254"), true);
  assert.equal(isBlockedIp("8.8.8.8"), false);
});

test("comparador de relatório detecta regressão e melhoria por campo", () => {
  const previous: any = { cases: [{ id: "case-1", fields: { title: true, description: false, imageUrl: true, canonicalUrl: false } }] };
  const current: any = { cases: [{ id: "case-1", fields: { title: true, description: true, imageUrl: false, canonicalUrl: false } }] };
  const comparison = compareReports(previous, current);
  assert.deepEqual(comparison.regressions, ["case-1 / imageUrl: found -> not found"]);
  assert.deepEqual(comparison.improvements, ["case-1 / description: not found -> found"]);
});
