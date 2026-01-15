// tests/support/guides/template-spy.tsx
// Centralised helper that mocks "@/routes/guides/_GuideSeoTemplate" and exposes spies.
import { vi } from "vitest";

type ReactElement = import("react").ReactElement;

interface TemplateSpyExports {
  createTemplateMock: () => {
    __esModule: true;
    default: (props: any) => ReactElement;
  };
  resetGuideTemplateSpy: () => void;
  getGuideTemplateProps: <T = any>() => T | undefined;
  getAllGuideTemplateProps: <T = any>() => T[];
  exerciseArticleLead: (ctx: any) => ReactElement | null;
  exerciseArticleExtras: (ctx: any) => ReactElement | null;
  exerciseBuildTocItems: (ctx: any) => any;
  exerciseBuildHowToSteps: (ctx: any) => any;
}

type HarnessFeatureSetting = "auto" | "off" | "force";
type HarnessFeatureState = Record<"syntheticToc" | "genericContent", HarnessFeatureSetting>;
type HarnessState = {
  allowGeneric: boolean;
  preferManual: boolean;
  suppressFallback: boolean;
  features: HarnessFeatureState;
};

const harnessStateHost = globalThis as typeof globalThis & {
  __GUIDE_HARNESS_STATE__?: HarnessState;
};

const templateSpy = vi.hoisted<TemplateSpyExports>(() => {
  const React = require("react") as typeof import("react");

  let lastProps: any | undefined;
  const calls: any[] = [];

  const assertProps = () => {
    if (!lastProps) {
      throw new Error(
        "Guide template spy has no captured props yet — ensure the route rendered.",
      );
    }
    return lastProps;
  };

  return {
    createTemplateMock() {
      return {
        __esModule: true as const,
        default: (props: any) => {
          const enhancedProps = { ...props };
          const structured = props?.structuredArticle;
          if (structured && typeof structured === "object") {
            const getExtras =
              typeof structured.getExtras === "function"
                ? (ctx: any) => structured.getExtras(ctx)
                : undefined;
            const selectTocItems =
              typeof structured.selectTocItems === "function"
                ? (extras: any, ctx: any) => structured.selectTocItems(extras, ctx)
                : undefined;
            if (getExtras && selectTocItems) {
              const ensureTocItems = (ctx: any, fallback?: any[]) => {
                const harnessState = harnessStateHost.__GUIDE_HARNESS_STATE__;
                if (
                  !harnessState ||
                  !harnessState.allowGeneric ||
                  harnessState.preferManual ||
                  harnessState.features?.syntheticToc === "off"
                ) {
                  if (Array.isArray(fallback) && fallback.length > 0) {
                    return fallback;
                  }
                  if (Array.isArray(ctx?.toc) && ctx.toc.length > 0) {
                    return ctx.toc;
                  }
                  return [];
                }
                try {
                  const extras = getExtras(ctx);
                  const items = selectTocItems(extras, ctx);
                  if (Array.isArray(items) && items.length > 0) return items;
                  if (extras) {
                    const tocFromExtras = (() => {
                      if (Array.isArray((extras as any).tocItems) && (extras as any).tocItems.length > 0) {
                        return (extras as any).tocItems as any[];
                      }
                      const derived: any[] = [];
                      if (Array.isArray((extras as any).sections)) {
                        for (const section of (extras as any).sections as any[]) {
                          if (section && typeof section.id === "string" && section.id.trim().length > 0) {
                            derived.push({
                              href: `#${section.id}`,
                              label: typeof section.title === "string" ? section.title : section.id,
                            });
                          }
                        }
                      }
                      if (Array.isArray((extras as any).tips) && (extras as any).tips.length > 0) {
                        derived.push({
                          href: "#tips",
                          label:
                            typeof (extras as any).tipsTitle === "string" && (extras as any).tipsTitle.trim().length > 0
                              ? (extras as any).tipsTitle
                              : "Tips",
                        });
                      }
                      if (Array.isArray((extras as any).faqs) && (extras as any).faqs.length > 0) {
                        derived.push({
                          href: "#faqs",
                          label:
                            typeof (extras as any).faqsTitle === "string" &&
                            (extras as any).faqsTitle.trim().length > 0
                              ? (extras as any).faqsTitle
                              : "FAQs",
                        });
                      }
                      if (Array.isArray((extras as any).galleryItems) && (extras as any).galleryItems.length > 0) {
                        derived.push({
                          href: "#gallery",
                          label:
                            typeof (extras as any).galleryTitle === "string" &&
                            (extras as any).galleryTitle.trim().length > 0
                              ? (extras as any).galleryTitle
                              : "Gallery",
                        });
                      }
                      return derived;
                    })();
                    if (tocFromExtras.length > 0) {
                      return tocFromExtras;
                    }
                  }
                } catch {
                  /* ignore */
                }
                if (Array.isArray(fallback) && fallback.length > 0) {
                  return fallback;
                }
                return [];
              };

              if (typeof enhancedProps.buildTocItems === "function") {
                const original = enhancedProps.buildTocItems;
                enhancedProps.buildTocItems = (ctx: any) => {
                  const result = original(ctx);
                  if (Array.isArray(result) && result.length > 0) {
                    return result;
                  }
                  return ensureTocItems(ctx, result);
                };
              } else {
                enhancedProps.buildTocItems = (ctx: any) => ensureTocItems(ctx);
              }
            }
          }
          lastProps = enhancedProps;
          calls.push(enhancedProps);
          return React.createElement("div", { "data-testid": "guide-seo-template" });
        },
      };
    },
    resetGuideTemplateSpy() {
      lastProps = undefined;
      calls.length = 0;
    },
    getGuideTemplateProps<T = any>() {
      return lastProps as T | undefined;
    },
    getAllGuideTemplateProps<T = any>() {
      return calls as T[];
    },
    exerciseArticleLead(ctx: any) {
      const props = assertProps();
      const fn = props?.articleLead;
      if (typeof fn !== "function") return null;
      return fn(ctx) ?? null;
    },
    exerciseArticleExtras(ctx: any) {
      const props = assertProps();
      const fn = props?.articleExtras;
      if (typeof fn !== "function") return null;
      return fn(ctx) ?? null;
    },
    exerciseBuildTocItems(ctx: any) {
      const props = assertProps();
      const fn = props?.buildTocItems;
      if (typeof fn !== "function") return null;
      return fn(ctx);
    },
    exerciseBuildHowToSteps(ctx: any) {
      const props = assertProps();
      const fn = props?.buildHowToSteps;
      if (typeof fn !== "function") return null;
      return fn(ctx);
    },
  };
});

vi.mock("@/routes/guides/_GuideSeoTemplate", () => templateSpy.createTemplateMock());
vi.mock("/src/routes/guides/_GuideSeoTemplate.tsx", () => templateSpy.createTemplateMock());
vi.mock("../../src/routes/guides/_GuideSeoTemplate.tsx", () => templateSpy.createTemplateMock());

export const resetGuideTemplateSpy = templateSpy.resetGuideTemplateSpy;
export const getGuideTemplateProps = templateSpy.getGuideTemplateProps;
export const getAllGuideTemplateProps = templateSpy.getAllGuideTemplateProps;
export const exerciseArticleLead = templateSpy.exerciseArticleLead;
export const exerciseArticleExtras = templateSpy.exerciseArticleExtras;
export const exerciseBuildTocItems = templateSpy.exerciseBuildTocItems;
export const exerciseBuildHowToSteps = templateSpy.exerciseBuildHowToSteps;