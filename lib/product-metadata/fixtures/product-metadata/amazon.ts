import type { StoreTestCase } from "../../domain/product-metadata.types";

export const AMAZON_CASES: StoreTestCase[] = [
  {
    id: "amazon-normal-01",
    label: "Amazon URL normal",
    url: "https://www.amazon.com.br/Echo-Dot-5%C2%AA-gera%C3%A7%C3%A3o-Cor-Preta/dp/B09B8V1LZ3",
    urlType: "normal",
    expectedStoreId: "amazon",
    expectedUrlTitle: "Echo Dot 5ª geração Cor Preta",
    expectedFields: { title: "required", description: "optional", imageUrl: "required", canonicalUrl: "optional" }
  },
  {
    id: "amazon-short-01",
    label: "Amazon URL encurtada a.co",
    url: "https://a.co/d/0dZp3hP",
    urlType: "shortened",
    expectedStoreId: "amazon",
    expectedFields: { title: "required", description: "optional", imageUrl: "required", canonicalUrl: "optional" }
  }
];
