import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@acme/auth";
import {
  diffHistory,
  type SettingsDiffEntry,
} from "@acme/platform-core/repositories/settings.server";

export const runtime = "nodejs";

type ComponentChange = string | { name?: string };
type PageDiff = { components?: ComponentChange[] };
type HistoryEntry = SettingsDiffEntry & {
  diff?: SettingsDiffEntry["diff"] & {
    pages?: Record<string, PageDiff>;
  };
};

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
    const history = (await diffHistory(shop)) as HistoryEntry[];
    const map = new Map<string, Set<string>>();
    for (const entry of history) {
      const pages = entry.diff?.pages;
      if (!pages) continue;
      for (const [pageId, pageDiff] of Object.entries(pages)) {
        const comps = pageDiff.components;
        if (!Array.isArray(comps)) continue;
        let set = map.get(pageId);
        if (!set) {
          set = new Set<string>();
          map.set(pageId, set);
        }
        for (const comp of comps) {
          const name = typeof comp === "string" ? comp : comp.name;
          if (typeof name === "string") set.add(name);
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

