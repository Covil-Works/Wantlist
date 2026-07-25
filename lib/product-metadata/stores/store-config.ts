import type { StoreExtractorConfig } from "../domain/product-metadata.types";
import { amazonUrlTitleParser } from "../parsers/amazon-url-title-parser";
import { centauroUrlTitleParser } from "../parsers/centauro-url-title-parser";
import { magaluUrlTitleParser, sephoraUrlTitleParser, sheinUrlTitleParser, shopeeUrlTitleParser } from "../parsers/current-url-title-parsers";
import { mercadoLivreUrlTitleParser } from "../parsers/mercado-livre-url-title-parser";

export const STORE_CONFIGS: StoreExtractorConfig[] = [
  {
    id: "amazon",
    label: "Amazon",
    hostnames: ["amazon.com.br", "www.amazon.com.br", "amazon.com", "www.amazon.com"],
    shortHostnames: ["a.co"],
    urlTitleParser: amazonUrlTitleParser,
    openGraphStrategies: ["DEFAULT", "BROWSER", "SOCIAL_FACEBOOK", "SOCIAL_WHATSAPP"]
  },
  {
    id: "mercado-livre",
    label: "Mercado Livre",
    hostnames: ["mercadolivre.com.br", "www.mercadolivre.com.br", "mercadolivre.com", "www.mercadolivre.com", "produto.mercadolivre.com.br"],
    shortHostnames: ["mercadolivre.com", "meli.to"],
    urlTitleParser: mercadoLivreUrlTitleParser,
    openGraphStrategies: ["SOCIAL_FACEBOOK", "SOCIAL_WHATSAPP", "BROWSER", "DEFAULT"]
  },
  {
    id: "centauro",
    label: "Centauro",
    hostnames: ["centauro.com.br", "www.centauro.com.br"],
    shortHostnames: [],
    urlTitleParser: centauroUrlTitleParser,
    openGraphStrategies: ["DEFAULT", "SOCIAL_WHATSAPP", "BROWSER", "SOCIAL_FACEBOOK"]
  },
  {
    id: "shopee",
    label: "Shopee",
    hostnames: ["shopee.com.br", "www.shopee.com.br"],
    shortHostnames: [],
    urlTitleParser: shopeeUrlTitleParser,
    openGraphStrategies: ["BROWSER", "DEFAULT"]
  },
  {
    id: "shein",
    label: "Shein",
    hostnames: ["shein.com", "br.shein.com", "www.shein.com"],
    shortHostnames: [],
    urlTitleParser: sheinUrlTitleParser,
    openGraphStrategies: ["BROWSER", "DEFAULT"]
  },
  {
    id: "magalu",
    label: "Magalu",
    hostnames: ["magazineluiza.com.br", "www.magazineluiza.com.br", "magalu.com", "www.magalu.com"],
    shortHostnames: [],
    urlTitleParser: magaluUrlTitleParser,
    openGraphStrategies: ["BROWSER", "DEFAULT"]
  },
  {
    id: "sephora",
    label: "Sephora",
    hostnames: ["sephora.com.br", "www.sephora.com.br"],
    shortHostnames: [],
    urlTitleParser: sephoraUrlTitleParser,
    openGraphStrategies: ["BROWSER", "DEFAULT"]
  }
];

export const GENERIC_STORE_CONFIG: StoreExtractorConfig = {
  id: "generic",
  label: "Loja desconhecida",
  hostnames: [],
  openGraphStrategies: ["BROWSER", "DEFAULT"]
};
