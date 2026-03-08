import {
  type CatalogProductDraftInput,
  catalogProductDraftSchema,
  type CatalogPublishState,
  slugify,
  splitList,
} from "./catalogAdminSchema.js";

export type CatalogDraftWorkflowReadiness = {
  isDataReady: boolean;
  isSubmissionReady: boolean;
  isPublishReady: boolean;
  hasImages: boolean;
  missingFieldPaths: string[];
  missingRoles: string[];
};

function normalizeSelectedPublishState(
  publishState: CatalogProductDraftInput["publishState"],
): CatalogPublishState {
  if (publishState === "live" || publishState === "out_of_stock") {
    return publishState;
  }
  return "draft";
}

type CatalogImageRoleReadiness = {
  isReadyForPublish: boolean;
};

function normalizeForDataValidation(draft: CatalogProductDraftInput): CatalogProductDraftInput {
  return {
    ...draft,
    imageFiles: "",
    imageAltTexts: "",
    createdAt: typeof draft.createdAt === "string" ? draft.createdAt : "",
  };
}

function buildImageReadiness(draft: CatalogProductDraftInput): CatalogImageRoleReadiness {
  const hasImages = splitList(draft.imageFiles ?? "").length > 0;
  return {
    isReadyForPublish: hasImages,
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
    publishState: normalizeSelectedPublishState(draft.publishState),
  };
}

export function getCatalogDraftWorkflowReadiness(
  draft: CatalogProductDraftInput,
): CatalogDraftWorkflowReadiness {
  const dataValidation = catalogProductDraftSchema.safeParse(normalizeForDataValidation(draft));
  const imageReadiness = buildImageReadiness(draft);
  const hasImages = splitList(draft.imageFiles ?? "").length > 0;
  const hasPublishableImages = hasImages && imageReadiness.isReadyForPublish;
  const missingFieldPaths = dataValidation.success
    ? []
    : Array.from(
        new Set(
          dataValidation.error.issues
            .map((issue) => issue.path.map(String).join("."))
            .filter(Boolean),
        ),
      );
  if (!hasImages) {
    missingFieldPaths.push("imageFiles");
  }
  return {
    isDataReady: dataValidation.success,
    hasImages,
    isSubmissionReady: dataValidation.success && hasPublishableImages,
    isPublishReady: dataValidation.success && hasPublishableImages,
    missingFieldPaths: Array.from(new Set(missingFieldPaths)),
    missingRoles: [],
  };
}

export function deriveCatalogPublishState(
  draft: CatalogProductDraftInput,
): CatalogPublishState {
  if (!getCatalogDraftWorkflowReadiness(draft).isPublishReady) {
    return "draft";
  }
  return normalizeSelectedPublishState(draft.publishState);
}

export function isCatalogPublishableState(state: CatalogPublishState): boolean {
  return state === "live" || state === "out_of_stock";
}
