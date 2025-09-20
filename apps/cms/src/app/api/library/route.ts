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
  const item = (payload as any)?.item as LibraryItem | undefined;
  if (!item || !item.id || !item.label) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }
  try {
    await saveLibraryItem(shop, item);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
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
  const id = (payload as any)?.id as string | undefined;
  const patch = (payload as any)?.patch as Partial<LibraryItem> | undefined;
  if (!id || !patch) return NextResponse.json({ error: "Invalid patch" }, { status: 400 });
  try {
    await updateLibraryItem(shop, id, patch as any);
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

