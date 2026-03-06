import {
  type CatalogProductDraftInput,
  catalogProductDraftSchema,
  type CatalogPublishState,
  slugify,
  splitList,
} from "./catalogAdminSchema.js";
import {
  normalizeXaImageRole,
  requiredImageRolesByCategory,
  type XaImageRole,
} from "./catalogImageRoles.js";

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
  hasRoleCountMatch: boolean;
  hasSupportedRoles: boolean;
  hasRequiredRoles: boolean;
  isReadyForPublish: boolean;
  missingRoles: XaImageRole[];
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

function buildImageRoleReadiness(draft: CatalogProductDraftInput): CatalogImageRoleReadiness {
  const imageFiles = splitList(draft.imageFiles ?? "");
  const requiredRoles = requiredImageRolesByCategory(draft.taxonomy.category);
  if (!imageFiles.length) {
    return {
      hasRoleCountMatch: false,
      hasSupportedRoles: false,
      hasRequiredRoles: false,
      isReadyForPublish: false,
      missingRoles: requiredRoles,
    };
  }

  const rawRoles = splitList(draft.imageRoles ?? "");
  const normalizedRoles = rawRoles
    .map((value) => normalizeXaImageRole(value))
    .filter((value): value is XaImageRole => value !== undefined);
  const hasRoleCountMatch = rawRoles.length === imageFiles.length;
  const hasSupportedRoles = normalizedRoles.length === rawRoles.length;
  const roleSet = new Set(normalizedRoles);
  const hasRequiredRoles = requiredRoles.every((role) => roleSet.has(role));
  const missingRoles = requiredRoles.filter((role) => !roleSet.has(role));
  return {
    hasRoleCountMatch,
    hasSupportedRoles,
    hasRequiredRoles,
    isReadyForPublish: hasRoleCountMatch && hasSupportedRoles && hasRequiredRoles,
    missingRoles,
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
  const imageRoleReadiness = buildImageRoleReadiness(draft);
  const hasImages = splitList(draft.imageFiles ?? "").length > 0;
  const hasPublishableImages = hasImages && imageRoleReadiness.isReadyForPublish;
  const missingFieldPaths = dataValidation.success
    ? []
    : Array.from(
        new Set(
          dataValidation.error.issues
            .map((issue) => issue.path.map(String).join("."))
            .filter(Boolean),
        ),
      );
  if (hasImages && !imageRoleReadiness.isReadyForPublish) {
    missingFieldPaths.push("imageRoles");
  }
  return {
    isDataReady: dataValidation.success,
    hasImages,
    isSubmissionReady: dataValidation.success && hasPublishableImages,
    isPublishReady: dataValidation.success && hasPublishableImages,
    missingFieldPaths: Array.from(new Set(missingFieldPaths)),
    missingRoles: imageRoleReadiness.missingRoles,
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
