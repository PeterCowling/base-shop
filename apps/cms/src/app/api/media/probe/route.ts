export const runtime = "edge";

async function handle(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("url");
  if (!target) {
    return new Response("Missing url", { status: 400 });
  }
  try {
    const res = await fetch(target, { method: "HEAD" });
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
