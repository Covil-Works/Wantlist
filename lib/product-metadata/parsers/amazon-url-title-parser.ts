import { createSlugParser } from "./url-title-parser";

export const amazonUrlTitleParser = createSlugParser(
  "amazon-url-title-parser",
  (url) => url.pathname.split("/").filter(Boolean)[0] || null
);
