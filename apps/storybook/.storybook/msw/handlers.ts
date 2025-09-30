import { http, HttpResponse, delay } from "msw";
import { PRODUCTS } from "../../../packages/platform-core/src/products/index";

type SBGlobals = { msw?: { delayMs: number; netError: boolean }; scenario?: string; netError?: string };

function pickByPreset(preset?: string) {
  const list = [...PRODUCTS];
  switch (preset) {
    case "new":
      return list.reverse();
    case "bestsellers":
      return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case "clearance":
      return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case "limited":
      return list.filter((p) => /black|rare|exclusive/i.test(p.title ?? ""));
    case "featured":
    default:
      return list;
  }
}

export const handlers = [
  // Simulate product search API for SearchBar stories
  http.get("/api/products", async ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;
    const globals = (globalThis as { __SB_GLOBALS__?: SBGlobals }).__SB_GLOBALS__;
    const ms = globals?.msw?.delayMs ?? 150;
    await delay(ms);
    if (globals?.msw?.netError) {
      return HttpResponse.json({ error: 'mock-error' }, { status: 500 });
    }
    const all = PRODUCTS.map((p) => ({
      slug: String(p.slug ?? p.id ?? ""),
      title: String(p.title ?? p.slug ?? p.id ?? ""),
    }));
    const filtered = q
      ? all.filter((r) => r.slug.toLowerCase().includes(q) || r.title.toLowerCase().includes(q))
      : all.slice(0, 10);
    const items = typeof limit === 'number' && Number.isFinite(limit) ? filtered.slice(0, Math.max(0, limit)) : filtered;
    return HttpResponse.json(items, { status: 200 });
  }),
  http.get("/api/recommendations", async ({ request }) => {
    const url = new URL(request.url);
    const globals = (globalThis as { __SB_GLOBALS__?: SBGlobals }).__SB_GLOBALS__;
    const preset = globals?.scenario ?? url.searchParams.get("preset") ?? undefined;
    const limit = Number(url.searchParams.get("limit") || "12");
    const items = pickByPreset(preset).slice(0, Math.max(1, Math.min(50, limit)));
    const ms = globals?.msw?.delayMs ?? 300;
    await delay(ms);
    if (globals?.msw?.netError || globals?.netError === 'on') {
      return HttpResponse.json({ error: 'mock-error' }, { status: 500 });
    }
    return HttpResponse.json(items, { status: 200 });
  }),
  http.get(/\/api\/collections\/.+/, async ({ request }) => {
    const url = new URL(request.url);
    const globals = (globalThis as { __SB_GLOBALS__?: SBGlobals }).__SB_GLOBALS__;
    const sort = url.searchParams.get("sort") || "";
    const items = [...PRODUCTS];
    // Scenario can drive a different sort to simulate merchandising
    const scenario = globals?.scenario;
    if (scenario === 'clearance') items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (scenario === 'bestsellers') items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else {
      if (sort === "price") items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      if (sort === "title") items.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    }
    const ms = globals?.msw?.delayMs ?? 300;
    await delay(ms);
    if (globals?.msw?.netError || globals?.netError === 'on') {
      return HttpResponse.json({ error: 'mock-error' }, { status: 500 });
    }
    return HttpResponse.json({ items }, { status: 200 });
  }),
  // Serve a dummy binary for 3D model requests used in AR stories
  http.get("/models/bag.glb", () => {
    const buf = new ArrayBuffer(8); // tiny placeholder
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    return new HttpResponse(blob, {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' },
    });
  }),
];
