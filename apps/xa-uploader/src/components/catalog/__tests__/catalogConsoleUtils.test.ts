import { describe, expect, it } from "@jest/globals";

import { catalogProductDraftSchema } from "../../../lib/catalogAdminSchema";
import { getUploaderMessage, type UploaderMessageKey } from "../../../lib/uploaderI18n";
import { localizeSchemaIssueMessage, toErrorMap } from "../catalogConsoleUtils";

function translate(
  locale: "en" | "zh",
  key: UploaderMessageKey,
  vars?: Record<string, string | number | boolean | null | undefined>,
) {
  let message = getUploaderMessage(locale, key);
  if (!vars) return message;
  for (const [varName, value] of Object.entries(vars)) {
    message = message.replaceAll(`{${varName}}`, String(value ?? ""));
  }
  return message;
}

describe("catalogConsoleUtils schema localization", () => {
  it("TC-01: localizes schema validation errors for zh locale", () => {
    const parsed = catalogProductDraftSchema.safeParse({
      title: "",
      brandHandle: "atelier-x",
      collectionHandle: "",
      collectionTitle: "",
      price: "189",
      description: "Structured layer",
      createdAt: "2025-12-01T12:00:00.000Z",
      forSale: true,
      forRental: false,
      popularity: "0",
      deposit: "0",
      stock: "1",
      sizes: "S|M",
      taxonomy: {
        department: "women",
        category: "clothing",
        subcategory: "outerwear",
        color: "black",
        material: "wool",
      },
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const errorMap = toErrorMap(parsed.error, (key, vars) => translate("zh", key, vars));
    expect(errorMap.title).toBe("标题不能为空。");
    expect(errorMap.collectionHandle).toBe("系列标识或系列标题至少填写一项。");
  });

  it("maps unknown schema messages to localized safe fallback", () => {
    const localized = localizeSchemaIssueMessage("Unexpected parser state", (key, vars) =>
      translate("zh", key, vars),
    );
    expect(localized).toBe("请检查高亮字段后重试。");
  });
});
