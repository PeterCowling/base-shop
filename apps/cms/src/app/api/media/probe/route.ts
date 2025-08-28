export const runtime = "edge";

async function handle(req: Request) {
  const urlParam = new URL(req.url).searchParams.get("url");
  if (!urlParam) {
    return new Response(null, { status: 400 });
  }
  try {
    const target = new URL(urlParam);
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return new Response(null, { status: 400 });
    }
    const res = await fetch(target.toString(), { method: "HEAD" });
    const type = res.headers.get("content-type") || "";
    if (type.startsWith("image/")) {
      return new Response(null, { status: 200, headers: { "content-type": type } });
    }
    return new Response(null, { status: 415 });
  } catch {
    return new Response(null, { status: 500 });
  }
}

export const GET = handle;
export const HEAD = handle;
