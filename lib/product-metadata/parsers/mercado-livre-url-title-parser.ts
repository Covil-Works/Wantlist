import { createSlugParser } from "./url-title-parser";

export const mercadoLivreUrlTitleParser = createSlugParser(
  "mercado-livre-url-title-parser",
  (url) => url.pathname.split("/").filter(Boolean)[0] || null
);
