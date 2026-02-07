import { ensureAuthorized } from "../common/auth";

import { deletePage as deletePageFromService } from "./service";
import { reportError } from "./utils";

export async function deletePage(shop: string, id: string): Promise<void> {
  await ensureAuthorized();
  try {
    await deletePageFromService(shop, id);
  } catch (err) {
    await reportError(err);
    throw err;
  }
}
