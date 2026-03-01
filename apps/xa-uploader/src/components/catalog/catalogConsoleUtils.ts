/* eslint-disable ds/no-hardcoded-copy -- XAUP-0001 [ttl=2026-12-31] schema message map for legacy zod output */

import type { UploaderMessageKey } from "../../lib/uploaderI18n";

type SchemaTranslate = (
  key: UploaderMessageKey,
  vars?: Record<string, string | number | boolean | null | undefined>,
) => string;

const SCHEMA_MESSAGE_TO_I18N_KEY: Record<string, UploaderMessageKey> = {
  "Title is required": "validationTitleRequired",
  "Brand handle is required": "validationBrandHandleRequired",
  "Collection handle or title is required": "validationCollectionRequired",
  "Description is required": "validationDescriptionRequired",
  "Subcategory is required": "validationSubcategoryRequired",
  "At least one color is required": "validationColorRequired",
  "At least one material is required": "validationMaterialRequired",
  "Image alt texts must match the number of images": "validationImageAltCount",
  "Image roles must match the number of images": "validationImageRoleCount",
  "Image roles contain unsupported values": "validationImageRoleUnsupported",
  "Sizes are required for clothing": "validationSizesRequired",
  "Metal is required for jewelry": "validationMetalRequired",
  "createdAt must be a valid date/time": "validationCreatedAt",
};

export function localizeSchemaIssueMessage(message: string, t?: SchemaTranslate): string {
  if (!t) return message;
  const exactKey = SCHEMA_MESSAGE_TO_I18N_KEY[message];
  if (exactKey) return t(exactKey);
  if (message.startsWith("Invalid ")) return t("validationInvalidValue");
  if (message.includes(" must be ≥ ")) return t("validationNonNegative");
  if (message.endsWith(" must be an integer")) return t("validationIntegerRequired");
  if (message.startsWith("Missing required image role:")) return t("validationImageRoleMissing");
  return t("validationUnknown");
}

export function toErrorMap(error: unknown, t?: SchemaTranslate) {
  if (!error || typeof error !== "object") return {};
  if (!("issues" in error)) return {};
  const issues = (error as { issues: Array<{ path: Array<string | number>; message: string }> })
    .issues;
  const out: Record<string, string> = {};
  issues.forEach((issue) => {
    const key = issue.path.map(String).join(".");
    out[key] ||= localizeSchemaIssueMessage(issue.message, t);
  });
  return out;
}

export function buildLogBlock(
  label: string,
  entry?: { code: number; stdout: string; stderr: string },
) {
  if (!entry) return "";
  const chunks = [`# ${label} (exit ${entry.code})`];
  if (entry.stdout.trim()) chunks.push(entry.stdout.trim());
  if (entry.stderr.trim()) chunks.push(entry.stderr.trim());
  return chunks.join("\n\n").trim();
}
