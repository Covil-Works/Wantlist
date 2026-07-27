import type { StoreTestCase } from "../../domain/product-metadata.types";

export const MERCADO_LIVRE_CASES: StoreTestCase[] = [
  {
    id: "mercado-livre-normal-01",
    label: "Mercado Livre URL normal",
    url: "https://www.mercadolivre.com.br/echo-dot-5-geraco-com-alexa-cor-preto/p/MLB19767171",
    urlType: "normal",
    expectedStoreId: "mercado-livre",
    expectedUrlTitle: "Echo dot 5 geraco com alexa cor preto",
    expectedFields: { title: "required", description: "optional", imageUrl: "required", canonicalUrl: "optional" }
  },
  {
    id: "mercado-livre-short-01",
    label: "Mercado Livre URL encurtada",
    url: "https://mercadolivre.com/sec/2Yf6zpu",
    urlType: "shortened",
    expectedStoreId: "mercado-livre",
    expectedFields: { title: "required", description: "optional", imageUrl: "required", canonicalUrl: "optional" }
  }
];
