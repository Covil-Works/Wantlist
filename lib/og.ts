import dns from "dns/promises";
import net from "net";
import { domainFromUrl } from "@/lib/validators";

const MAX_BYTES = 512_000;

function isPrivateIp(ip: string) {
  if (net.isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 169;
  }
  return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80");
}

export async function assertSafeUrl(input: string) {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("URL deve usar HTTP ou HTTPS.");
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) throw new Error("Endereco interno bloqueado.");
  const records = await dns.lookup(url.hostname, { all: true });
  if (records.some((record) => isPrivateIp(record.address))) throw new Error("IP privado bloqueado.");
  return url;
}

function pickMeta(html: string, property: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  return html.match(re)?.[1]?.trim();
}

export async function extractOpenGraph(input: string) {
  const url = await assertSafeUrl(input);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "WantlistBot/1.0" }
    });
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Resposta vazia.");
    let received = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      if (received > MAX_BYTES) break;
      chunks.push(value);
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks));
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
    return {
      ok: true,
      title: pickMeta(html, "og:title") || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || "",
      description: pickMeta(html, "og:description") || pickMeta(html, "description") || "",
      imageUrl: pickMeta(html, "og:image") || "",
      originalUrl: canonical ? new URL(canonical, url).toString() : url.toString(),
      domain: domainFromUrl(url.toString())
    };
  } finally {
    clearTimeout(timeout);
  }
}
