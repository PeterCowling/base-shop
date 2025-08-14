import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@auth";
import { diffHistory } from "@platform-core/repositories/settings.server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("manage_pages");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) {
    return NextResponse.json({ error: "shop required" }, { status: 400 });
  }

  try {
    const history = await diffHistory(shop);
    const map = new Map<string, Set<string>>();
    for (const entry of history as Array<{ diff?: any }>) {
      const pages = entry?.diff?.pages;
      if (!pages || typeof pages !== "object") continue;
      for (const [pageId, pageDiff] of Object.entries(pages as Record<string, any>)) {
        const comps = (pageDiff as any)?.components;
        if (!Array.isArray(comps)) continue;
        let set = map.get(pageId);
        if (!set) {
          set = new Set<string>();
          map.set(pageId, set);
        }
        for (const comp of comps) {
          const name = typeof comp === "string" ? comp : (comp as any)?.name;
          if (name) set.add(name);
        }
      }
    }
    const components = Array.from(map.entries()).flatMap(([pageId, names]) =>
      Array.from(names).map((name) => ({ pageId, name }))
    );
    components.sort((a, b) =>
      a.pageId.localeCompare(b.pageId) || a.name.localeCompare(b.name)
    );
    return NextResponse.json({ components });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

