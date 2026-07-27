import type { UrlTitleParser } from "../domain/product-metadata.types";
import { humanizeSlug } from "./url-title-parser";

export const centauroUrlTitleParser: UrlTitleParser = {
  id: "centauro-url-title-parser",
  parse(url) {
    const segment = url.pathname.split("/").filter(Boolean).at(-1);
    if (!segment) return null;
    const slug = segment
      .replace(/\.html?$/i, "")
      .replace(/-[A-Z0-9]+$/i, "")
      .replace(/(\d{4})-(\d{2})(?=-|$)/g, "$1/$2");
    const parsed = humanizeSlug(slug);
    return parsed ? parsed.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase()) : null;
  }
};