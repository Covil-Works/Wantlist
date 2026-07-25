import type { StoreTestCase } from "../../domain/product-metadata.types";

export const SEPHORA_CASES: StoreTestCase[] = [
  {
    id: "sephora-normal-01",
    label: "Sephora URL normal",
    url: "https://www.sephora.com.br/product/base-liquida-mate-P12345",
    urlType: "normal",
    expectedStoreId: "sephora",
    expectedUrlTitle: "Base liquida mate",
    expectedFields: { title: "required", description: "optional", imageUrl: "optional", canonicalUrl: "optional" }
  }
];
