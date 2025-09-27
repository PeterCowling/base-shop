import { http, HttpResponse, delay } from "msw";
import { PRODUCTS } from "../packages/platform-core/src/products/index";

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
  http.get("/api/recommendations", async ({ request }) => {
    const url = new URL(request.url);
    const globals = (globalThis as any).__SB_GLOBALS__ as { scenario?: string; netError?: string } | undefined;
    const preset = globals?.scenario ?? url.searchParams.get("preset") ?? undefined;
    const limit = Number(url.searchParams.get("limit") || "12");
    const items = pickByPreset(preset).slice(0, Math.max(1, Math.min(50, limit)));
    const net = (globalThis as any).__SB_GLOBALS__?.net as string | undefined;
    const ms = net === 'slow' ? 1000 : net === 'fast' ? 0 : 300;
    await delay(ms);
    if (globals?.netError === 'on') {
      return HttpResponse.json({ error: 'mock-error' }, { status: 500 });
    }
    return HttpResponse.json(items, { status: 200 });
  }),
  http.get(/\/api\/collections\/.+/, async ({ request }) => {
    const url = new URL(request.url);
    const globals = (globalThis as any).__SB_GLOBALS__ as { scenario?: string; netError?: string } | undefined;
    const sort = url.searchParams.get("sort") || "";
    let items = [...PRODUCTS];
    // Scenario can drive a different sort to simulate merchandising
    const scenario = globals?.scenario;
    if (scenario === 'clearance') items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (scenario === 'bestsellers') items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else {
      if (sort === "price") items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      if (sort === "title") items.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    }
    const net = (globalThis as any).__SB_GLOBALS__?.net as string | undefined;
    const ms = net === 'slow' ? 1000 : net === 'fast' ? 0 : 300;
    await delay(ms);
    if (globals?.netError === 'on') {
      return HttpResponse.json({ error: 'mock-error' }, { status: 500 });
    }
    return HttpResponse.json({ items }, { status: 200 });
  }),
  // Serve a dummy binary for 3D model requests used in AR stories
  http.get("/models/bag.glb", () => {
    const buf = new ArrayBuffer(8); // tiny placeholder
    return new HttpResponse(buf as any, {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' },
    });
  }),
];
