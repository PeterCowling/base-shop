import { NextResponse } from "next/server";

import { XA_PRODUCTS } from "../../../../lib/demoData";

export const runtime = "edge";

function fnv1a(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const CACHE_CONTROL = "private, max-age=0, must-revalidate"; // i18n-exempt -- XA-0100 [ttl=2026-12-31] HTTP header value
const ETAG = `"xa-search-${fnv1a(JSON.stringify(XA_PRODUCTS))}"`;

export function GET(request: Request) {
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === ETAG) {
    const res = new NextResponse(null, { status: 304 });
    res.headers.set("ETag", ETAG);
    res.headers.set("Cache-Control", CACHE_CONTROL);
    return res;
  }

  return NextResponse.json(
    { version: ETAG, products: XA_PRODUCTS },
    { headers: { ETag: ETAG, "Cache-Control": CACHE_CONTROL } },
  );
}
