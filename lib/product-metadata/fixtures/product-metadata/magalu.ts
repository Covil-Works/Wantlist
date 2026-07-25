import type { StoreTestCase } from "../../domain/product-metadata.types";

export const MAGALU_CASES: StoreTestCase[] = [
  {
    id: "magalu-normal-01",
    label: "Magalu URL normal",
    url: "https://www.magazineluiza.com.br/air-fryer-mondial-family/p/12345678/ep/efry/",
    urlType: "normal",
    expectedStoreId: "magalu",
    expectedUrlTitle: "Air fryer mondial family",
    expectedFields: { title: "required", description: "optional", imageUrl: "optional", canonicalUrl: "optional" }
  }
];
