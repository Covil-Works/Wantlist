import type { StoreTestCase } from "../../domain/product-metadata.types";

export const SHEIN_CASES: StoreTestCase[] = [
  {
    id: "shein-normal-01",
    label: "Shein URL normal",
    url: "https://br.shein.com/vestido-midi-floral-p-123456.html",
    urlType: "normal",
    expectedStoreId: "shein",
    expectedUrlTitle: "Vestido midi floral",
    expectedFields: { title: "required", description: "optional", imageUrl: "optional", canonicalUrl: "optional" }
  }
];
