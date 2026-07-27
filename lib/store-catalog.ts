import type { Item } from "@/lib/types";

export enum StoreId {
  Amazon = "amazon",
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
  {
    id: StoreId.Amazon,
    label: "Amazon",
    domains: ["amazon.com.br", "amazon.com", "a.co", "amzn.to"],
  },
];

function normalizeDomain(value: string) {
  const candidate = value.trim().toLowerCase();
  if (!candidate) return "";

  try {
    const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return candidate.split("/")[0].split(":")[0].replace(/^www\./, "");
  }
}

export function resolveStore(value: string): Store {
  const domain = normalizeDomain(value);
  const definition = STORE_CATALOG.find((store) =>
    store.domains.some((alias) => domain === alias || domain.endsWith(`.${alias}`)),
  );

  if (definition) {
    return { id: definition.id, label: definition.label, domain };
  }

  return {
    id: domain ? `domain:${domain}` : "unknown",
    label: domain || "Loja não identificada",
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