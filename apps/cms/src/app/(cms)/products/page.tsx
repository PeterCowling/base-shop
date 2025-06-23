// apps/cms/src/app/(cms)/products/page.tsx
import { authOptions } from "@cms/auth/options";
import { readRepo } from "@platform-core/repositories/json";
import ProductsTable from "@ui/components/cms/ProductsTable"; // ← new
import { getServerSession } from "next-auth";
import { createDraft } from "../../../actions/products";

export const revalidate = 0;

export default async function ProductsPage() {
  const [session, rows] = await Promise.all([
    getServerSession(authOptions),
    readRepo("abc"),
  ]);

  const role = session?.user.role ?? "viewer";
  const isAdmin = role === "admin";

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Products</h2>

        {isAdmin && (
          <form action={createDraft}>
            <button className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90">
              New product
            </button>
          </form>
        )}
      </div>
      <ProductsTable rows={rows} isAdmin={isAdmin} /> {/* ← */}
      {role === "viewer" && (
        <p className="mt-4 rounded-md bg-yellow-50 p-2 text-sm text-yellow-700">
          You are signed in as a <b>viewer</b>. Editing is disabled.
        </p>
      )}
    </>
  );
}
