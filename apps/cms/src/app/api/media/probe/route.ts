export const runtime = "edge";

async function handler(req: Request) {
  const urlParam = new URL(req.url).searchParams.get("url");
  if (!urlParam) return new Response(null, { status: 400 });
  try {
    const target = new URL(urlParam);
    if (!/^https?:$/.test(target.protocol)) {
      return new Response(null, { status: 400 });
    }
    if (/^(localhost|127\.|0\.0\.0\.0|::1)/.test(target.hostname)) {
      return new Response(null, { status: 400 });
    }
    const res = await fetch(target.toString(), { method: "HEAD" });
    const type = res.headers.get("content-type");
    if (!res.ok || !type || !type.startsWith("image/")) {
      return new Response(null, { status: 415 });
    }
    return new Response(null, { status: 200, headers: { "content-type": type } });
  } catch {
    return new Response(null, { status: 400 });
  }
}

export { handler as GET, handler as HEAD };
