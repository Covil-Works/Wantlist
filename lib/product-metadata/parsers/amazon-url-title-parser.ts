import type { UrlTitleParser } from "../domain/product-metadata.types";
import { humanizeSlug } from "./url-title-parser";

const TECHNICAL_SEGMENTS = new Set(["dp", "gp", "product", "exec", "obidos", "ASIN"]);
const ASIN_PATTERN = /^[A-Z0-9]{10}$/i;

export const amazonUrlTitleParser: UrlTitleParser = {
  id: "amazon-url-title-parser",
  parse(url) {
    const segment = url.pathname
      .split("/")
      .filter(Boolean)
      .find((part) => !TECHNICAL_SEGMENTS.has(part) && !ASIN_PATTERN.test(part));

    return segment ? humanizeSlug(segment) : null;
  }
};