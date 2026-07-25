import { STORE_CONFIGS } from "../stores/store-config";

export function getShortLinkHostnames() {
  return STORE_CONFIGS.flatMap((store) => store.shortHostnames ?? []);
}
