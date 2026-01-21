// apps/cms/src/app/cms/shop/[shop]/CreationStatus.tsx

import { readShopCreationState } from "@acme/platform-core/createShop";
import { validateShopName } from "@acme/platform-core/shops";

export const revalidate = 0;

export default async function CreationStatus({ shop }: { shop: string }) {
  let safeId: string;
  try {
    safeId = validateShopName(shop);
  } catch {
    return null;
  }

  const state = await readShopCreationState(safeId);
  if (!state) return null;

  const { status, lastError } = state;

  return (
    <div className="rounded-xl border border-border/20 bg-surface-2 p-4 text-sm">
      <p className="font-medium">Creation status: {status}</p>
      {lastError ? (
        <p className="mt-1 text-destructive">
          Last error: {lastError}
        </p>
      ) : null}
    </div>
  );
}

