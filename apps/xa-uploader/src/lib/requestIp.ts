function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function isValidIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;

  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return false;
    const parsed = Number.parseInt(part, 10);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) return false;
  }

  return true;
}

function countIpv6Groups(parts: string[]): number {
  let groups = 0;

  for (const [index, part] of parts.entries()) {
    if (!part) return -1;

    if (part.includes(".")) {
      if (index !== parts.length - 1 || !isValidIpv4(part)) {
        return -1;
      }
      groups += 2;
      continue;
    }

    if (!/^[\da-fA-F]{1,4}$/.test(part)) return -1;
    groups += 1;
  }

  return groups;
}

function isValidIpv6(value: string): boolean {
  if (!value || value.includes("%")) return false;

  const doubleColonIndex = value.indexOf("::");
  if (doubleColonIndex !== value.lastIndexOf("::")) return false;

  if (doubleColonIndex === -1) {
    return countIpv6Groups(value.split(":")) === 8;
  }

  const leftRaw = value.slice(0, doubleColonIndex);
  const rightRaw = value.slice(doubleColonIndex + 2);
  const leftParts = leftRaw ? leftRaw.split(":") : [];
  const rightParts = rightRaw ? rightRaw.split(":") : [];
  const leftGroups = countIpv6Groups(leftParts);
  const rightGroups = countIpv6Groups(rightParts);

  if (leftGroups < 0 || rightGroups < 0) return false;
  return leftGroups + rightGroups < 8;
}

function normalizeIpCandidate(raw: string | null): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";

  const first = trimmed.split(",")[0]?.trim() ?? "";
  if (!first) return "";

  if (first.startsWith("[") && first.includes("]")) {
    const bracketed = first.slice(1, first.indexOf("]")).trim();
    return isValidIpv6(bracketed) ? bracketed : "";
  }

  if (isValidIpv6(first)) return first;

  const withoutPort = first.includes(":") ? first.split(":")[0]?.trim() ?? "" : first;
  return isValidIpv4(withoutPort) ? withoutPort : "";
}

const TRUST_PROXY_IP_HEADERS = parseBool(process.env.XA_TRUST_PROXY_IP_HEADERS);

export function getTrustedRequestIpFromHeaders(headers: Headers): string {
  if (!TRUST_PROXY_IP_HEADERS) return "";

  const cfConnectingIp = normalizeIpCandidate(headers.get("cf-connecting-ip"));
  if (cfConnectingIp) return cfConnectingIp;

  const forwarded = normalizeIpCandidate(headers.get("x-forwarded-for"));
  if (forwarded) return forwarded;

  return normalizeIpCandidate(headers.get("x-real-ip"));
}

export function getTrustedRequestIp(request: Request): string {
  return getTrustedRequestIpFromHeaders(request.headers);
}
