import { ensureAuthorized } from "../common/auth";
import { deleteSection } from "@acme/platform-core/repositories/sections/index.server";

export async function deleteSectionAction(shop: string, id: string): Promise<{ ok?: boolean; error?: string }> {
  await ensureAuthorized();
  try {
    await deleteSection(shop, id);
    return { ok: true };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

