import type { Item } from "@/lib/types";

export enum StoreId {
  Amazon = "amazon",
  AliExpress = "aliexpress",
  MercadoLivre = "mercado-livre",
  Shopee = "shopee",
  MagazineLuiza = "magazine-luiza",
  Kabum = "kabum",
  Americanas = "americanas",
  CasasBahia = "casas-bahia",
  Ponto = "ponto",
  Shein = "shein",
  Temu = "temu",
  Netshoes = "netshoes",
  Centauro = "centauro",
  Renner = "renner",
  Riachuelo = "riachuelo",
  Cea = "cea",
  Dafiti = "dafiti",
  Carrefour = "carrefour",
  FastShop = "fast-shop",
  MadeiraMadeira = "madeira-madeira",
  LeroyMerlin = "leroy-merlin",
  Samsung = "samsung",
  Apple = "apple",
  Nike = "nike",
  Adidas = "adidas",
  Sephora = "sephora",
  OBoticario = "o-boticario",
  Natura = "natura",
  EpocaCosmeticos = "epoca-cosmeticos",
  Zattini = "zattini",
  EstanteVirtual = "estante-virtual",
}

type StoreDefinition = {
  id: StoreId;
  label: string;
  domains: readonly string[];
};

export type Store = {
  id: string;
  label: string;
  domain: string;
};

const STORE_CATALOG: readonly StoreDefinition[] = [
  { id: StoreId.Amazon, label: "Amazon", domains: ["amazon.com.br", "amazon.com", "amazon.co.uk", "amazon.ca", "amazon.com.mx", "amazon.com.au", "amazon.co.jp", "amazon.de", "amazon.es", "amazon.fr", "amazon.it", "amazon.in", "a.co", "amzn.to"] },
  { id: StoreId.AliExpress, label: "AliExpress", domains: ["aliexpress.com", "aliexpress.us"] },
  { id: StoreId.MercadoLivre, label: "Mercado Livre", domains: ["mercadolivre.com.br", "mercadolibre.com", "mercadolibre.com.ar", "mercadolibre.com.mx", "meli.la"] },
  { id: StoreId.Shopee, label: "Shopee", domains: ["shopee.com.br", "shopee.com", "shopee.sg", "shope.ee"] },
  { id: StoreId.MagazineLuiza, label: "Magazine Luiza", domains: ["magazineluiza.com.br", "magalu.com", "mglu.io"] },
  { id: StoreId.Kabum, label: "KaBuM!", domains: ["kabum.com.br"] },
  { id: StoreId.Americanas, label: "Americanas", domains: ["americanas.com.br"] },
  { id: StoreId.CasasBahia, label: "Casas Bahia", domains: ["casasbahia.com.br"] },
  { id: StoreId.Ponto, label: "Ponto", domains: ["ponto.com.br"] },
  { id: StoreId.Shein, label: "SHEIN", domains: ["shein.com", "shein.com.br"] },
  { id: StoreId.Temu, label: "Temu", domains: ["temu.com"] },
  { id: StoreId.Netshoes, label: "Netshoes", domains: ["netshoes.com.br"] },
  { id: StoreId.Centauro, label: "Centauro", domains: ["centauro.com.br"] },
  { id: StoreId.Renner, label: "Renner", domains: ["lojasrenner.com.br"] },
  { id: StoreId.Riachuelo, label: "Riachuelo", domains: ["riachuelo.com.br"] },
  { id: StoreId.Cea, label: "C&A", domains: ["cea.com.br"] },
  { id: StoreId.Dafiti, label: "Dafiti", domains: ["dafiti.com.br"] },
  { id: StoreId.Carrefour, label: "Carrefour", domains: ["carrefour.com.br"] },
  { id: StoreId.FastShop, label: "Fast Shop", domains: ["fastshop.com.br"] },
  { id: StoreId.MadeiraMadeira, label: "MadeiraMadeira", domains: ["madeiramadeira.com.br"] },
  { id: StoreId.LeroyMerlin, label: "Leroy Merlin", domains: ["leroymerlin.com.br"] },
  { id: StoreId.Samsung, label: "Samsung", domains: ["samsung.com", "samsung.com.br"] },
  { id: StoreId.Apple, label: "Apple", domains: ["apple.com"] },
  { id: StoreId.Nike, label: "Nike", domains: ["nike.com", "nike.com.br"] },
  { id: StoreId.Adidas, label: "adidas", domains: ["adidas.com", "adidas.com.br"] },
  { id: StoreId.Sephora, label: "Sephora", domains: ["sephora.com.br"] },
  { id: StoreId.OBoticario, label: "O Boticário", domains: ["boticario.com.br", "oboticario.com.br"] },
  { id: StoreId.Natura, label: "Natura", domains: ["natura.com.br"] },
  { id: StoreId.EpocaCosmeticos, label: "Época Cosméticos", domains: ["epocacosmeticos.com.br"] },
  { id: StoreId.Zattini, label: "Zattini", domains: ["zattini.com.br"] },
  { id: StoreId.EstanteVirtual, label: "Estante Virtual", domains: ["estantevirtual.com.br"] },
];

const COUNTRY_SECOND_LEVEL_SUFFIXES = new Set(["co", "com", "net", "org"]);

function normalizeDomain(value: string) {
  const candidate = value.trim().toLowerCase();
  if (!candidate) return "";

  try {
    const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    return url.hostname.replace(/^www\d*\./, "");
  } catch {
    return candidate.split("/")[0].split(":")[0].replace(/^www\d*\./, "");
  }
}

function getCanonicalDomainKey(domain: string) {
  const labels = domain.split(".").filter(Boolean);
  if (labels.length < 2) return labels[0] || "unknown";

  const topLevelDomain = labels.at(-1) || "";
  const secondLevelDomain = labels.at(-2) || "";
  const usesCountrySecondLevelSuffix = topLevelDomain.length === 2
    && COUNTRY_SECOND_LEVEL_SUFFIXES.has(secondLevelDomain);

  return usesCountrySecondLevelSuffix
    ? labels.at(-3) || secondLevelDomain
    : secondLevelDomain;
}

function formatStoreLabel(domainKey: string) {
  return domainKey
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Loja não identificada";
}

export function resolveStore(value: string): Store {
  const domain = normalizeDomain(value);
  const definition = STORE_CATALOG.find((store) =>
    store.domains.some((alias) => domain === alias || domain.endsWith(`.${alias}`)),
  );

  if (definition) {
    return { id: definition.id, label: definition.label, domain };
  }

  const domainKey = getCanonicalDomainKey(domain);
  return {
    id: `domain:${domainKey}`,
    label: formatStoreLabel(domainKey),
    domain,
  };
}

export function getStoreOptions(items: Pick<Item, "domain">[]) {
  const stores = new Map<string, Store>();

  for (const item of items) {
    const store = resolveStore(item.domain);
    stores.set(store.id, store);
  }

  return [...stores.values()].sort((first, second) =>
    first.label.localeCompare(second.label, "pt-BR", { sensitivity: "base" }),
  );
}