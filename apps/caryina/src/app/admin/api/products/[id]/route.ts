import { NextResponse } from "next/server";

import {
  deleteProductFromRepo,
  getProductById,
  updateProductInRepo,
} from "@acme/platform-core/repositories/products.server";
import type { ProductPublication } from "@acme/types";

import { updateProductSchema } from "@/lib/adminSchemas";

const SHOP = "caryina";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await getProductById(SHOP, id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const { title, description, ...rest } = parsed.data;

  const existingTitle = existing.title as unknown as Record<string, string>;
  const existingDescription = existing.description as unknown as Record<string, string>;

  const patch: Partial<ProductPublication> & { id: string } = {
    id,
    updated_at: new Date().toISOString(),
    ...rest,
    ...(title !== undefined
      ? { title: { ...existingTitle, en: title, de: title, it: title } as ProductPublication["title"] }
      : {}),
    ...(description !== undefined
      ? {
          description: {
            ...existingDescription,
            en: description,
            de: description,
            it: description,
          } as ProductPublication["description"],
        }
      : {}),
  };

  const updated = await updateProductInRepo(SHOP, patch);
  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    await deleteProductFromRepo(SHOP, id);
  } catch {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
