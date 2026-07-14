const MAX_PRODUCT_NAME_LENGTH = 140;

type StoreResolver = {
  matches: (hostname: string) => boolean;
  slug: (url: URL) => string | null;
};

function pathSegmentAfter(url: URL, marker: string) {
  const segments = url.pathname.split("/").filter(Boolean);
  const markerIndex = segments.findIndex((segment) => segment.toLowerCase() === marker);
  return markerIndex >= 0 ? segments[markerIndex + 1] || null : null;
}

const resolvers: StoreResolver[] = [
  {
    matches: (hostname) => hostname.includes("mercadolivre"),
    slug: (url) => url.pathname.split("/").filter(Boolean)[0] || null
  },
  {
    matches: (hostname) => hostname.includes("shopee"),
    slug: (url) => url.pathname.split("/").filter(Boolean).at(-1)?.replace(/-i\.\d+\.\d+$/i, "") || null
  },
  {
    matches: (hostname) => hostname.includes("shein"),
    slug: (url) => url.pathname.split("/").filter(Boolean).at(-1)?.replace(/-p-\d+\.html$/i, "") || null
  },
  {
    matches: (hostname) => hostname.includes("magazineluiza") || hostname.includes("magalu"),
    slug: (url) => url.pathname.split("/").filter(Boolean)[0] || null
  },
  {
    matches: (hostname) => hostname.includes("sephora"),
    slug: (url) => pathSegmentAfter(url, "product")?.replace(/-P\d+$/i, "") || null
  },
  {
    matches: (hostname) => hostname.includes("amazon"),
    slug: (url) => url.pathname.split("/").filter(Boolean)[0] || null
  }
];

function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function truncateName(name: string) {
  if (name.length <= MAX_PRODUCT_NAME_LENGTH) return name;
  const slice = name.slice(0, MAX_PRODUCT_NAME_LENGTH - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 80 ? lastSpace : slice.length).trimEnd()}...`;
}

function humanizeSlug(slug: string) {
  const name = decodeSlug(slug)
    .replace(/\.html?$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!name || /^\d+$/.test(name)) return null;
  return truncateName(name.charAt(0).toUpperCase() + name.slice(1));
}

export function resolveProductName(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const hostname = url.hostname.toLowerCase();
  const resolver = resolvers.find((candidate) => candidate.matches(hostname));
  if (!resolver) return null;

  const slug = resolver.slug(url);
  return slug ? humanizeSlug(slug) : null;
}
