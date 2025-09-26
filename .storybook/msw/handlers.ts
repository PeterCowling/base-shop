import { http, HttpResponse } from "msw";
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
  http.get("/api/recommendations", ({ request }) => {
    const url = new URL(request.url);
    const preset = url.searchParams.get("preset") ?? undefined;
    const limit = Number(url.searchParams.get("limit") || "12");
    const items = pickByPreset(preset).slice(0, Math.max(1, Math.min(50, limit)));
    return HttpResponse.json(items, { status: 200 });
  }),
  http.get(/\/api\/collections\/.+/, ({ request }) => {
    const url = new URL(request.url);
    const sort = url.searchParams.get("sort") || "";
    let items = [...PRODUCTS];
    if (sort === "price") items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === "title") items.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    return HttpResponse.json({ items }, { status: 200 });
  }),
];
