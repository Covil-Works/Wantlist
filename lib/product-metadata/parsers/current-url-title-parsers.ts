import { createSlugParser, pathSegmentAfter } from "./url-title-parser";

export const shopeeUrlTitleParser = createSlugParser(
  "shopee-url-title-parser",
  (url) => url.pathname.split("/").filter(Boolean).at(-1)?.replace(/-i\.\d+\.\d+$/i, "") || null
);

export const sheinUrlTitleParser = createSlugParser(
  "shein-url-title-parser",
  (url) => url.pathname.split("/").filter(Boolean).at(-1)?.replace(/-p-\d+\.html$/i, "") || null
);

export const magaluUrlTitleParser = createSlugParser(
  "magalu-url-title-parser",
  (url) => url.pathname.split("/").filter(Boolean)[0] || null
);

export const sephoraUrlTitleParser = createSlugParser(
  "sephora-url-title-parser",
  (url) => {
    const productSlug = pathSegmentAfter(url, "product")?.replace(/-P\d+$/i, "");
    const directSlug = url.pathname
      .split("/")
      .filter(Boolean)
      .at(-1)
      ?.replace(/(?:-\d+){1,}\.html$/i, "");

    return productSlug || directSlug || null;
  }
);
