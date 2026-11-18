import { lookup } from "node:dns/promises";
import net from "node:net";
import { InvalidUrlError, UnsafeHostError } from "./errors.js";

const BLOCKED_HOSTNAMES = new Set(["localhost"]);
const BLOCKED_IPV4_LOCALITIES = new Set([
  loopbackIpv4,
  privateIpv4,
  linkLocalIpv4,
  carrierGradeNatIpv4,
  thisNetworkIpv4,
  multicastAndReservedIpv4,
]);

export async function guardUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InvalidUrlError(
      url.href,
      `unsupported protocol "${url.protocol}". Only http: and https: are allowed.`,
    );
  }
  const host = normalizeHost(url.hostname);
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new UnsafeHostError(url.href, host, "a well-known local name");
  }
  let addresses;
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch (cause) {
    throw new InvalidUrlError(
      url.href,
      `host "${host}" could not be resolved: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }
  for (const { address } of addresses) {
    if (isPrivateAddress(address)) {
      throw new UnsafeHostError(
        url.href,
        host,
        `resolvable to a private or loopback address (${address})`,
      );
    }
  }
}

export function parseUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new InvalidUrlError(raw, "it is not a valid absolute URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InvalidUrlError(
      raw,
      `unsupported protocol "${url.protocol}". Only http: and https: are allowed.`,
    );
  }
  return url;
}

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

function isPrivateAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    return [...BLOCKED_IPV4_LOCALITIES.values()].some((check) => check(address));
  }
  return isPrivateIpv6(address.toLowerCase());
}

function ipv4Octets(address: string): [number, number, number, number] {
  const parts = address.split(".").map(Number);
  return [parts[0], parts[1], parts[2], parts[3]];
}

function loopbackIpv4(address: string): boolean {
  const [a] = ipv4Octets(address);
  return a === 127;
}

function privateIpv4(address: string): boolean {
  const [a, b] = ipv4Octets(address);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function linkLocalIpv4(address: string): boolean {
  const [a, b] = ipv4Octets(address);
  return a === 169 && b === 254;
}

function carrierGradeNatIpv4(address: string): boolean {
  const [a, b] = ipv4Octets(address);
  return a === 100 && b >= 64 && b <= 127;
}

function thisNetworkIpv4(address: string): boolean {
  const [a] = ipv4Octets(address);
  return a === 0 || a === 255;
}

function multicastAndReservedIpv4(address: string): boolean {
  const [a, b] = ipv4Octets(address);
  return a >= 224 || (a === 198 && (b === 18 || b === 19));
}

function isPrivateIpv6(address: string): boolean {
  if (address === "::1" || address === "::") {
    return true;
  }
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) {
    return isPrivateIpv4AddressString(mapped[1]);
  }
  const firstGroup = address.split(":")[0];
  if (firstGroup.startsWith("fe8") || firstGroup.startsWith("fe9") || firstGroup.startsWith("fea") || firstGroup.startsWith("feb")) {
    return true;
  }
  return firstGroup.startsWith("fc") || firstGroup.startsWith("fd");
}

function isPrivateIpv4AddressString(address: string): boolean {
  return loopbackIpv4(address) || privateIpv4(address) || linkLocalIpv4(address);
}
