import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);
const CLOUD_METADATA_IPS = new Set(["169.254.169.254"]);

function ipv4ToNumber(ip: string) {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

function inRange(ip: string, start: string, end: string) {
  const value = ipv4ToNumber(ip);
  return value >= ipv4ToNumber(start) && value <= ipv4ToNumber(end);
}

export function isBlockedIp(ip: string) {
  if (CLOUD_METADATA_IPS.has(ip)) return true;
  if (net.isIP(ip) === 4) {
    return (
      inRange(ip, "10.0.0.0", "10.255.255.255") ||
      inRange(ip, "127.0.0.0", "127.255.255.255") ||
      inRange(ip, "169.254.0.0", "169.254.255.255") ||
      inRange(ip, "172.16.0.0", "172.31.255.255") ||
      inRange(ip, "192.168.0.0", "192.168.255.255") ||
      inRange(ip, "0.0.0.0", "0.255.255.255")
    );
  }
  if (net.isIP(ip) === 6) {
    const value = ip.toLowerCase();
    return value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:");
  }
  return false;
}

export async function validateExternalUrl(url: URL, lookup: typeof dns.lookup = dns.lookup) {
  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false as const, errorCode: "invalid_protocol" };
  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) return { ok: false as const, errorCode: "blocked_hostname" };
  if (net.isIP(hostname) && isBlockedIp(hostname)) return { ok: false as const, errorCode: "blocked_ip" };

  try {
    const records = await lookup(hostname, { all: true });
    if (records.some((record) => isBlockedIp(record.address))) return { ok: false as const, errorCode: "blocked_ip" };
  } catch {
    return { ok: false as const, errorCode: "dns_failed" };
  }

  return { ok: true as const };
}
