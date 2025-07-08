import { deleteMedia, listMedia, uploadMedia } from "@cms/actions/media.server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }
  try {
    const files = await listMedia(shop);
    return NextResponse.json(files);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const orientation =
    (url.searchParams.get("orientation") as "portrait" | "landscape" | null) ??
    "landscape";
  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }
  try {
    const data = await req.formData();
    const item = await uploadMedia(shop, data, orientation);
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const file = url.searchParams.get("file");
  if (!shop || !file) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  try {
    await deleteMedia(shop, file);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
