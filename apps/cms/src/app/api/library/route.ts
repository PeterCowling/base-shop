import { NextResponse } from "next/server";
import {
  listLibrary,
  saveLibraryItem,
  removeLibraryItem,
  clearUserLibrary,
  updateLibraryItem,
  type LibraryItem,
} from "@cms/actions/library.server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  try {
    const items = await listLibrary(shop);
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const record = (payload && typeof payload === 'object') ? (payload as Record<string, unknown>) : undefined;
  const item = (record?.item as unknown) as LibraryItem | undefined;
  const items = (record?.items as unknown) as LibraryItem[] | undefined;
  if (!item && !Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }
  try {
    if (Array.isArray(items)) {
      for (const it of items) {
        if (!it || !it.id || !it.label) continue;
        await saveLibraryItem(shop, it);
      }
    } else if (item) {
      await saveLibraryItem(shop, item);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    type ValidationIssue = import("@acme/platform-core/validation/componentRules").ValidationIssue;
    type ValidationErrorShape = Error & {
      code?: string;
      issues?: ValidationIssue[];
    };
    const e = err as ValidationErrorShape;
    const body: { error: string; issues?: ValidationIssue[] } = {
      error: e?.message || "Request failed",
    };
    if (e && (e.code === "VALIDATION" || e.name === "ValidationError") && Array.isArray(e.issues)) {
      body.issues = e.issues;
    }
    return NextResponse.json(body, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const rec = (payload && typeof payload === 'object') ? (payload as Record<string, unknown>) : undefined;
  const id = (rec?.id as unknown) as string | undefined;
  const patch = (rec?.patch as unknown) as Partial<LibraryItem> | undefined;
  if (!id || !patch) return NextResponse.json({ error: "Invalid patch" }, { status: 400 });
  try {
    await updateLibraryItem(shop, id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  const id = url.searchParams.get("id");
  const all = url.searchParams.get("all");
  try {
    if (all) {
      await clearUserLibrary(shop);
    } else if (id) {
      await removeLibraryItem(shop, id);
    } else {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
