import { z } from "zod";

export type BicSchemaVersion = "0.1";

export type BicLoadState = "loading" | "interactive" | "network-idle";

export type BicRisk = "safe" | "caution" | "danger";

export type BicLandmark = "main" | "nav" | "footer" | "modal" | "banner" | "unknown";

export type BicBlockingOverlay = {
  present: boolean;
  label?: string;
};

export type BicBlocker = {
  type: string;
  present: boolean;
  text?: string;
};

export type BicBanner = {
  severity: "info" | "warning" | "error";
  text: string;
};

export type BicModal = {
  title?: string;
  name?: string;
  excerpt?: string;
};

export type BicFrame = {
  frameId: string;
  frameUrl?: string;
  frameName?: string;
};

export type BicFingerprint = {
  kind: string;
  value: string;
};

export type BicAffordanceConstraints = {
  type?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
};

export type BicAffordance = {
  actionId: string;
  role: string;
  name: string;
  visible: boolean;
  disabled: boolean;
  risk: BicRisk;
  landmark: BicLandmark;
  href?: string;
  required?: boolean;
  constraints?: BicAffordanceConstraints;
  value?: string;
  valueRedacted?: boolean;
  sensitive?: boolean;
  frameId?: string;
  nearText?: string;
  fingerprint?: BicFingerprint;
};

export type BicFormFieldRef = { actionId: string };

export type BicForm = {
  section?: string;
  fields: ReadonlyArray<BicFormFieldRef>;
};

export type BicPageIdentity = {
  domain: string;
  url: string;
  finalUrl: string;
  lang?: string;
  title?: string;
  primaryHeading?: string;
  routeKey?: string;
  loadState: BicLoadState;
  blockingOverlay: BicBlockingOverlay;
  blockers: ReadonlyArray<BicBlocker>;
  banners: ReadonlyArray<BicBanner>;
  modals: ReadonlyArray<BicModal>;
  frames: ReadonlyArray<BicFrame>;
};

export type BicObservation = {
  schemaVersion: BicSchemaVersion;
  observationId: string;
  createdAt: string;
  page: BicPageIdentity;
  nextCursor?: string;
  hasMore: boolean;
  affordances: ReadonlyArray<BicAffordance>;
  forms: ReadonlyArray<BicForm>;
};

const blockingOverlaySchema = z.object({
  present: z.boolean(),
  label: z.string().min(1).optional(),
});

const blockerSchema = z.object({
  type: z.string().min(1),
  present: z.boolean(),
  text: z.string().min(1).optional(),
});

const bannerSchema = z.object({
  severity: z.enum(["info", "warning", "error"]),
  text: z.string().min(1),
});

const modalSchema = z.object({
  title: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  excerpt: z.string().min(1).optional(),
});

const frameSchema = z.object({
  frameId: z.string().min(1),
  frameUrl: z.string().url().optional(),
  frameName: z.string().min(1).optional(),
});

const fingerprintSchema = z.object({
  kind: z.string().min(1),
  value: z.string().min(1),
});

const affordanceConstraintsSchema = z.object({
  type: z.string().min(1).optional(),
  pattern: z.string().min(1).optional(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().nonnegative().optional(),
});

const affordanceSchema = z.object({
  actionId: z.string().min(1),
  role: z.string().min(1),
  name: z.string(),
  visible: z.boolean(),
  disabled: z.boolean(),
  risk: z.enum(["safe", "caution", "danger"]),
  landmark: z.enum(["main", "nav", "footer", "modal", "banner", "unknown"]),
  href: z.string().url().optional(),
  required: z.boolean().optional(),
  constraints: affordanceConstraintsSchema.optional(),
  value: z.string().optional(),
  valueRedacted: z.boolean().optional(),
  sensitive: z.boolean().optional(),
  frameId: z.string().min(1).optional(),
  nearText: z.string().min(1).optional(),
  fingerprint: fingerprintSchema.optional(),
});

const formSchema = z.object({
  section: z.string().min(1).optional(),
  fields: z.array(z.object({ actionId: z.string().min(1) })).min(0),
});

const pageIdentitySchema = z.object({
  domain: z.string().min(1),
  url: z.string().url(),
  finalUrl: z.string().url(),
  lang: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  primaryHeading: z.string().min(1).optional(),
  routeKey: z.string().min(1).optional(),
  loadState: z.enum(["loading", "interactive", "network-idle"]),
  blockingOverlay: blockingOverlaySchema,
  blockers: z.array(blockerSchema),
  banners: z.array(bannerSchema),
  modals: z.array(modalSchema),
  frames: z.array(frameSchema),
});

export const bicSchema = z.object({
  schemaVersion: z.literal("0.1"),
  observationId: z.string().min(1),
  createdAt: z.string().min(1),
  page: pageIdentitySchema,
  nextCursor: z.string().min(1).optional(),
  hasMore: z.boolean(),
  affordances: z.array(affordanceSchema),
  forms: z.array(formSchema),
});

