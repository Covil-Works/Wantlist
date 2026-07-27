import type { StoreTestCase } from "../../domain/product-metadata.types";

export const SHOPEE_CASES: StoreTestCase[] = [
  {
    id: "shopee-normal-01",
    label: "Shopee URL normal",
    url: "https://shopee.com.br/fone-bluetooth-jbl-wave-buds-i.123456789.987654321",
    urlType: "normal",
    expectedStoreId: "shopee",
    expectedUrlTitle: "Fone bluetooth jbl wave buds",
    expectedFields: { title: "required", description: "optional", imageUrl: "optional", canonicalUrl: "optional" }
  }
];
