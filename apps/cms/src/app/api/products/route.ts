import { NextResponse, type NextRequest } from "next/server";
import { PRODUCTS } from "@/lib/products";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const slug = searchParams.get("slug");
  if (slug) {
    const product = PRODUCTS.find((p) => p.slug === slug);
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  }
  let matches = PRODUCTS;
  if (q) {
    const norm = q.toLowerCase();
    matches = matches.filter((p) => p.title.toLowerCase().includes(norm));
  }
  return NextResponse.json(matches.slice(0, 5));
}
