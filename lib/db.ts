import { neon } from "@neondatabase/serverless";

export function getSql() {
  if (!process.env.WANTLIST_DATABASE_URL) {
    throw new Error("WANTLIST_DATABASE_URL ausente. Configure o Neon nas variáveis de ambiente.");
  }
  return neon(process.env.WANTLIST_DATABASE_URL);
}

export const sql = new Proxy(() => undefined, {
  apply(_target, _thisArg, args) {
    return Reflect.apply(getSql(), undefined, args);
  }
}) as unknown as (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, any>[]>;
