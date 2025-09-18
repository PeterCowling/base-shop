import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";

export const runtime = "edge";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function parseIPv4(input: string) {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(input)) {
    return null;
  }
  const octets = input.split(".").map((part) => Number(part));
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return octets as [number, number, number, number];
}

function parseIPv4FromMappedIPv6(segment: string) {
  if (segment.includes(".")) {
    return parseIPv4(segment);
  }
  const parts = segment.split(":");
  if (parts.length !== 2) {
    return null;
  }
  if (parts.some((part) => part.length === 0)) {
    return null;
  }
  const parsed = parts.map((part) => Number.parseInt(part, 16));
  if (parsed.some((value) => Number.isNaN(value) || value < 0 || value > 0xffff)) {
    return null;
  }
  const [high, low] = parsed as [number, number];
  return [high >> 8, high & 0xff, low >> 8, low & 0xff] as [number, number, number, number];
}

function isPrivateIPv4(octets: [number, number, number, number]) {
  const [a, b] = octets;
  if (a === 10) {
    return true;
  }
  if (a === 127) {
    return true;
  }
  if (a === 0) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  return false;
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  if (!normalized) {
    return true;
  }
  if (normalized === "localhost") {
    return true;
  }

  const ipv4 = parseIPv4(normalized);
  if (ipv4) {
    return isPrivateIPv4(ipv4);
  }

  if (normalized.includes(":")) {
    if (normalized === "::" || normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") {
      return true;
    }
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice("::ffff:".length);
      const mappedIpv4 = parseIPv4(mapped) ?? parseIPv4FromMappedIPv6(mapped);
      if (mappedIpv4) {
        return isPrivateIPv4(mappedIpv4);
      }
    }
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
      return true;
    }
    if (
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb")
    ) {
      return true;
    }
  }

  return false;
}

function parseAndValidateTarget(raw: string) {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return null;
  }
  if (isPrivateHostname(parsed.hostname)) {
    return null;
  }
  return parsed;
}

async function handle(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const target = url.searchParams.get("url");
  if (!target) {
    return new Response("Missing url", { status: 400 });
  }

  const parsedTarget = parseAndValidateTarget(target);
  if (!parsedTarget) {
    return new Response("Invalid url", { status: 400 });
  }

  try {
    const res = await fetch(parsedTarget, { method: "HEAD" });
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !type.startsWith("image/")) {
      return new Response("Unsupported media type", { status: 415 });
    }
    return new Response(null, { status: 200, headers: { "content-type": type } });
  } catch {
    return new Response("Fetch failed", { status: 400 });
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function HEAD(req: Request) {
  return handle(req);
}
