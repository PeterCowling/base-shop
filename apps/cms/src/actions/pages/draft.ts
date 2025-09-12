import { nowIso } from "@acme/date-utils";
import type { Page } from "@acme/types";
import { ulid } from "ulid";
import { ensureAuthorized } from "../common/auth";
import { componentsField, emptyTranslated } from "./validation";
import { getPages, savePage } from "./service";
import { parseHistory, reportError } from "./utils";

export async function savePageDraft(
  shop: string,
  formData: FormData
): Promise<{ page?: Page; errors?: Record<string, string[]> }> {
  const compInput = formData.get("components");
  const parsedComponents = componentsField.safeParse(
    typeof compInput === "string" ? compInput : undefined
  );
  if (!parsedComponents.success) {
    return { errors: { components: ["Invalid components"] } };
  }
  const components = parsedComponents.data;

  const idField = formData.get("id");
  const id =
    typeof idField === "string" && idField.trim().length
      ? idField.trim()
      : ulid();

  const history = await parseHistory(formData.get("history"));

  const session = await ensureAuthorized();

  const pages = await getPages(shop);
  const now = nowIso();
  const existing = pages.find((p) => p.id === id);

  const page: Page = existing
    ? {
        ...existing,
        components,
        history,
        updatedAt: now,
      }
    : {
        id,
        slug: "",
        status: "draft",
        components,
        history,
        seo: {
          title: emptyTranslated(),
          description: emptyTranslated(),
          image: emptyTranslated(),
        },
        createdAt: now,
        updatedAt: now,
        createdBy: session.user.email ?? "unknown",
      };

  try {
    const saved = await savePage(shop, page, existing);
    return { page: saved };
  } catch (err) {
    await reportError(err);
    throw err;
  }
}
