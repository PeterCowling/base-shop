import {
  type CatalogProductDraftInput,
  catalogProductDraftSchema,
  slugify,
  splitList,
} from "./catalogAdminSchema.js";

export type CatalogDraftWorkflowReadiness = {
  isDataReady: boolean;
  isSubmissionReady: boolean;
  isPublishReady: boolean;
  hasImages: boolean;
  missingFieldPaths: string[];
};

function normalizeForDataValidation(draft: CatalogProductDraftInput): CatalogProductDraftInput {
  return {
    ...draft,
    imageFiles: "",
    imageAltTexts: "",
    imageRoles: "",
    createdAt: typeof draft.createdAt === "string" ? draft.createdAt : "",
  };
}

export function withAutoCatalogDraftFields(
  draft: CatalogProductDraftInput,
  nowIso = new Date().toISOString(),
): CatalogProductDraftInput {
  const title = typeof draft.title === "string" ? draft.title.trim() : "";
  const slugSource = typeof draft.slug === "string" ? draft.slug : "";
  const normalizedCreatedAt =
    typeof draft.createdAt === "string" && draft.createdAt.trim()
      ? draft.createdAt.trim()
      : nowIso;
  return {
    ...draft,
    slug: slugify(slugSource || title),
    createdAt: normalizedCreatedAt,
    forSale: true,
    forRental: false,
    publishState: draft.publishState ?? "draft",
  };
}

export function getCatalogDraftWorkflowReadiness(
  draft: CatalogProductDraftInput,
): CatalogDraftWorkflowReadiness {
  const dataValidation = catalogProductDraftSchema.safeParse(normalizeForDataValidation(draft));
  const hasImages = splitList(draft.imageFiles ?? "").length > 0;
  const missingFieldPaths = dataValidation.success
    ? []
    : Array.from(
        new Set(
          dataValidation.error.issues
            .map((issue) => issue.path.map(String).join("."))
            .filter(Boolean),
        ),
      );
  return {
    isDataReady: dataValidation.success,
    hasImages,
    isSubmissionReady: dataValidation.success && hasImages,
    isPublishReady: dataValidation.success && hasImages,
    missingFieldPaths,
  };
}
