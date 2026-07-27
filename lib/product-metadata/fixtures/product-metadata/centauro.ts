import type { StoreTestCase } from "../../domain/product-metadata.types";

export const CENTAURO_CASES: StoreTestCase[] = [
  {
    id: "centauro-normal-01",
    label: "Centauro camisa Brasil com query",
    url: "https://www.centauro.com.br/camisa-brasil-nike-i-2026-27-torcedor-pro-masculina-99752I.html?cor=B7",
    urlType: "normal",
    expectedStoreId: "centauro",
    expectedUrlTitle: "Camisa Brasil Nike I 2026/27 Torcedor Pro Masculina",
    expectedFields: { title: "required", description: "optional", imageUrl: "required", canonicalUrl: "optional" }
  },
  {
    id: "centauro-normal-02",
    label: "Centauro camisa Brasil sem query",
    url: "https://www.centauro.com.br/camisa-brasil-nike-i-2026-27-torcedor-pro-masculina-99752I.html",
    urlType: "normal",
    expectedStoreId: "centauro",
    expectedUrlTitle: "Camisa Brasil Nike I 2026/27 Torcedor Pro Masculina",
    expectedFields: { title: "required", description: "optional", imageUrl: "required", canonicalUrl: "optional" }
  }
];
