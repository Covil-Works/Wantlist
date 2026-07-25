import type { StoreTestCase } from "../../domain/product-metadata.types";
import { AMAZON_CASES } from "./amazon";
import { CENTAURO_CASES } from "./centauro";
import { MAGALU_CASES } from "./magalu";
import { MERCADO_LIVRE_CASES } from "./mercado-livre";
import { SEPHORA_CASES } from "./sephora";
import { SHEIN_CASES } from "./shein";
import { SHOPEE_CASES } from "./shopee";

export const STORE_TEST_CASES: Record<string, StoreTestCase[]> = {
  amazon: AMAZON_CASES,
  "mercado-livre": MERCADO_LIVRE_CASES,
  centauro: CENTAURO_CASES,
  shopee: SHOPEE_CASES,
  shein: SHEIN_CASES,
  magalu: MAGALU_CASES,
  sephora: SEPHORA_CASES
};

export function getAllStoreTestCases() {
  return Object.values(STORE_TEST_CASES).flat();
}