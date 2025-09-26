// packages/ui/src/components/cms/page-builder/__tests__/libraryStore.test.ts
import {
  listLibrary,
  saveLibrary,
  updateLibrary,
  removeLibrary,
  clearLibrary,
  type LibraryItem,
} from "../libraryStore";
import { server, rest } from "~test/msw/server";

function make(id: string, label = "Item"): LibraryItem {
  return { id, label, createdAt: Date.now(), shared: false } as LibraryItem;
}

describe("libraryStore", () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch {}
  });

  test("local (no shop): save, update, remove, clear", async () => {
    const a = make("a", "First");
    expect(listLibrary(null)).toEqual([]);
    await saveLibrary(null, a);
    expect(listLibrary(null).map((i) => i.id)).toEqual(["a"]);

    await updateLibrary(null, "a", { label: "Renamed" });
    expect(listLibrary(null)[0]!.label).toBe("Renamed");

    await removeLibrary(null, "a");
    expect(listLibrary(null)).toEqual([]);

    // Clear is idempotent
    await clearLibrary(null);
    expect(listLibrary(null)).toEqual([]);
  });

  test("server-backed (shop): save, update, remove, clear", async () => {
    const shop = "s1";
    let remote: LibraryItem[] = [];

    server.use(
      rest.get("/api/library", (req, res, ctx) => {
        // return only items for this test regardless of query
        return res(ctx.status(200), ctx.json(remote));
      }),
      rest.post("/api/library", async (req, res, ctx) => {
        const body = await req.json().catch(() => ({} as any));
        const incoming = (body as any).item as LibraryItem | undefined;
        if (incoming) {
          remote = [incoming, ...remote.filter((i) => i.id !== incoming.id)];
        }
        return res(ctx.status(200), ctx.json({ ok: true }));
      }),
      rest.patch("/api/library", async (req, res, ctx) => {
        const body = await req.json().catch(() => ({} as any));
        const id = (body as any).id as string;
        const patch = (body as any).patch as Partial<LibraryItem>;
        remote = remote.map((i) => (i.id === id ? { ...i, ...patch } : i));
        return res(ctx.status(200), ctx.json({ ok: true }));
      }),
      rest.delete("/api/library", (req, res, ctx) => {
        const id = req.url.searchParams.get("id");
        const all = req.url.searchParams.get("all");
        if (all) remote = [];
        if (id) remote = remote.filter((i) => i.id !== id);
        return res(ctx.status(200), ctx.json({ ok: true }));
      })
    );

    // Save -> server + local reflect item
    const item = make("srv1", "Remote One");
    await saveLibrary(shop, item);
    expect(listLibrary(shop).map((i) => i.id)).toEqual(["srv1"]);

    // Update on server syncs to local
    await updateLibrary(shop, "srv1", { label: "Updated" });
    expect(listLibrary(shop)[0]!.label).toBe("Updated");

    // Remove
    await removeLibrary(shop, "srv1");
    expect(listLibrary(shop)).toEqual([]);

    // Add two, then clear
    await saveLibrary(shop, make("x1", "X1"));
    await saveLibrary(shop, make("x2", "X2"));
    expect(listLibrary(shop).length).toBe(2);
    await clearLibrary(shop);
    expect(listLibrary(shop)).toEqual([]);
  });

  test("globals (shop): save/update/remove and page-scoped variants", async () => {
    const shop = "s1";
    let globals: any[] = [];
    const pages: Record<string, any[]> = {};

    server.use(
      // Collection handlers for globals
      rest.get("/api/globals", (req, res, ctx) => {
        const pageId = req.url.searchParams.get("pageId") || "";
        if (pageId) {
          return res(ctx.status(200), ctx.json(pages[pageId] || []));
        }
        return res(ctx.status(200), ctx.json(globals));
      }),
      rest.post("/api/globals", async (req, res, ctx) => {
        const url = new URL(req.url.toString());
        const pageId = url.searchParams.get("pageId") || "";
        const body = await req.json().catch(() => ({} as any));
        const item = (body as any).item;
        if (pageId) {
          const arr = pages[pageId] || [];
          pages[pageId] = [item, ...arr.filter((g) => g.globalId !== item.globalId)];
        } else {
          globals = [item, ...globals.filter((g) => g.globalId !== item.globalId)];
        }
        return res(ctx.status(200), ctx.json({ ok: true }));
      }),
      rest.patch("/api/globals", async (req, res, ctx) => {
        const url = new URL(req.url.toString());
        const pageId = url.searchParams.get("pageId") || "";
        const body = await req.json().catch(() => ({} as any));
        const id = (body as any).globalId as string;
        const patch = (body as any).patch as any;
        if (pageId) {
          const arr = pages[pageId] || [];
          pages[pageId] = arr.map((g) => (g.globalId === id ? { ...g, ...patch } : g));
        } else {
          globals = globals.map((g) => (g.globalId === id ? { ...g, ...patch } : g));
        }
        return res(ctx.status(200), ctx.json({ ok: true }));
      }),
      rest.delete("/api/globals", (req, res, ctx) => {
        const url = new URL(req.url.toString());
        const pageId = url.searchParams.get("pageId") || "";
        const id = url.searchParams.get("id") || "";
        if (pageId) {
          const arr = pages[pageId] || [];
          pages[pageId] = arr.filter((g) => g.globalId !== id);
        } else {
          globals = globals.filter((g) => g.globalId !== id);
        }
        return res(ctx.status(200), ctx.json({ ok: true }));
      })
    );

    const { listGlobals, saveGlobal, updateGlobal, removeGlobal, listGlobalsForPage, saveGlobalForPage, updateGlobalForPage, removeGlobalForPage } = await import("../libraryStore");

    const g1 = { globalId: "g1", label: "G1", createdAt: Date.now(), template: { id: "a", type: "Text" } } as any;
    await saveGlobal(shop, g1);
    expect(listGlobals(shop).map((g) => g.globalId)).toEqual(["g1"]);
    await updateGlobal(shop, "g1", { label: "G1-upd" });
    expect(listGlobals(shop)[0]!.label).toBe("G1-upd");
    await removeGlobal(shop, "g1");
    expect(listGlobals(shop)).toEqual([]);

    const pageId = "p1";
    const pg = { globalId: "pg1", label: "PG1", createdAt: Date.now(), template: { id: "b", type: "Button" } } as any;
    await saveGlobalForPage(shop, pageId, pg);
    expect(listGlobalsForPage(shop, pageId).map((g) => g.globalId)).toEqual(["pg1"]);
    await updateGlobalForPage(shop, pageId, "pg1", { label: "PG1-upd" });
    expect(listGlobalsForPage(shop, pageId)[0]!.label).toBe("PG1-upd");
    await removeGlobalForPage(shop, pageId, "pg1");
    expect(listGlobalsForPage(shop, pageId)).toEqual([]);
  });
});
