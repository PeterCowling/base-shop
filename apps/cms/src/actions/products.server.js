// apps/cms/src/actions/products.ts
"use server";
import { productSchema } from "@cms/actions/schemas";
import { authOptions } from "@cms/auth/options";
import { deleteProductFromRepo, duplicateProductInRepo, getProductById, readRepo, readSettings, updateProductInRepo, writeRepo, } from "@platform-core/repositories/json.server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ulid } from "ulid";
/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */
async function ensureAuthorized() {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role === "viewer") {
        throw new Error("Forbidden");
    }
}
async function getLocales(shop) {
    const settings = await readSettings(shop);
    return settings.languages;
}
/* -------------------------------------------------------------------------- */
/*  Create draft                                                               */
/* -------------------------------------------------------------------------- */
export async function createDraftRecord(shop) {
    await ensureAuthorized();
    const now = new Date().toISOString();
    const locales = await getLocales(shop);
    const blank = {};
    locales.forEach((l) => {
        blank[l] = "";
    });
    const first = locales[0] ?? "en";
    const title = { ...blank, [first]: "Untitled" };
    const description = { ...blank };
    const draft = {
        id: ulid(),
        sku: `DRAFT-${Date.now()}`,
        title,
        description,
        price: 0,
        currency: "EUR",
        images: [],
        status: "draft",
        shop,
        row_version: 1,
        created_at: now,
        updated_at: now,
    };
    const repo = await readRepo(shop);
    await writeRepo(shop, [draft, ...repo]);
    return draft;
}
/* Server-action: called by “New product” button */
export async function createDraft(shop) {
    "use server";
    await ensureAuthorized();
    const draft = await createDraftRecord(shop);
    redirect(`/cms/shop/${shop}/products/${draft.id}/edit`);
}
/* -------------------------------------------------------------------------- */
/*  Update product                                                             */
/* -------------------------------------------------------------------------- */
export async function updateProduct(shop, formData) {
    "use server";
    await ensureAuthorized();
    const parsed = productSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        const { fieldErrors } = parsed.error.flatten();
        return { errors: fieldErrors };
    }
    const data = parsed.data;
    const { id, price } = data;
    const current = await getProductById(shop, id);
    if (!current)
        throw new Error(`Product ${id} not found in ${shop}`);
    const nextTitle = { ...current.title };
    const nextDesc = { ...current.description };
    const locales = await getLocales(shop);
    locales.forEach((l) => {
        const t = data[`title_${l}`];
        const d = data[`desc_${l}`];
        if (typeof t === "string")
            nextTitle[l] = t;
        if (typeof d === "string")
            nextDesc[l] = d;
    });
    const updated = {
        ...current,
        title: nextTitle,
        description: nextDesc,
        price,
        row_version: current.row_version + 1,
        updated_at: new Date().toISOString(),
    };
    const saved = await updateProductInRepo(shop, updated);
    return { product: saved };
}
/* -------------------------------------------------------------------------- */
/*  Duplicate product                                                          */
/* -------------------------------------------------------------------------- */
export async function duplicateProduct(shop, id) {
    "use server";
    await ensureAuthorized();
    const copy = await duplicateProductInRepo(shop, id);
    redirect(`/cms/shop/${shop}/products/${copy.id}/edit`);
}
/* -------------------------------------------------------------------------- */
/*  Delete product                                                             */
/* -------------------------------------------------------------------------- */
export async function deleteProduct(shop, id) {
    "use server";
    await ensureAuthorized();
    await deleteProductFromRepo(shop, id);
    redirect(`/cms/shop/${shop}/products`);
}
