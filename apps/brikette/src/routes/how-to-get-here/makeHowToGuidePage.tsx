// src/routes/how-to-get-here/makeHowToGuidePage.tsx
import { memo, useCallback, type MemoExoticComponent } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

import GuideSeoTemplate, { type GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import type {
  AlsoHelpfulConfig,
  GuideSeoTemplateProps,
  RelatedGuidesConfig,
} from "@/routes/guides/guide-seo/types";

type HowToGuideExtrasFactory<Extras> = (context: GuideSeoTemplateContext) => Extras;

type HowToGuideLoader = (args: LoaderFunctionArgs) => unknown | Promise<unknown>;

type HowToGuideModules<Extras, Loader extends HowToGuideLoader> = {
  breadcrumb: {
    buildBreadcrumb: NonNullable<GuideSeoTemplateProps["buildBreadcrumb"]>;
  };
  articleLead: {
    renderArticleLead: (
      context: GuideSeoTemplateContext,
      extras: Extras,
    ) => ReturnType<NonNullable<GuideSeoTemplateProps["articleLead"]>>;
  };
  selectors: {
    selectTocItems: (
      extras: Extras,
    ) => ReturnType<NonNullable<GuideSeoTemplateProps["buildTocItems"]>>;
    selectHowToSteps: (
      extras: Extras,
    ) => ReturnType<NonNullable<GuideSeoTemplateProps["buildHowToSteps"]>>;
  };
  guideExtras: {
    createGuideExtras: HowToGuideExtrasFactory<Extras>;
  };
  guideFaqFallback: {
    resolveGuideFaqFallback: NonNullable<GuideSeoTemplateProps["guideFaqFallback"]>;
  };
  loader: {
    clientLoader: Loader;
  };
};

type HowToGuideConstants = {
  GUIDE_KEY: GuideSeoTemplateProps["guideKey"];
  OG_IMAGE: NonNullable<GuideSeoTemplateProps["ogImage"]>;
  RELATED_GUIDES: ReadonlyArray<{ key: GuideSeoTemplateProps["guideKey"] }>;
  ALSO_HELPFUL_TAGS: ReadonlyArray<string>;
};

type HowToGuideOptions = Pick<
  GuideSeoTemplateProps,
  "renderGenericContent" | "showPlanChoice" | "showTransportNotice"
> & {
  alsoHelpful?: Partial<AlsoHelpfulConfig> | null;
  relatedGuides?: RelatedGuidesConfig | null;
};

type HowToGuideFactoryConfig<Extras, Loader extends HowToGuideLoader> = {
  modules: HowToGuideModules<Extras, Loader>;
  constants: HowToGuideConstants;
  options?: HowToGuideOptions;
};

type HowToGuideFactoryResult<Loader extends HowToGuideLoader> = {
  component: MemoExoticComponent<() => JSX.Element>;
  loader: Loader;
};

const DEFAULT_ALSO_HELPFUL_SECTION = "help" as const;

export function makeHowToGuidePage<Extras, Loader extends HowToGuideLoader>({
  modules,
  constants,
  options,
}: HowToGuideFactoryConfig<Extras, Loader>): HowToGuideFactoryResult<Loader> {
  const {
    breadcrumb,
    articleLead,
    guideExtras,
    guideFaqFallback,
    selectors,
    loader,
  } = modules;

  const renderGenericContent = options?.renderGenericContent ?? false;
  const showPlanChoice = options?.showPlanChoice ?? false;
  const showTransportNotice = options?.showTransportNotice ?? true;

  const defaultRelatedGuides: RelatedGuidesConfig | undefined = constants.RELATED_GUIDES.length
    ? { items: constants.RELATED_GUIDES }
    : undefined;

  const relatedGuides: RelatedGuidesConfig | undefined =
    options?.relatedGuides === null ? undefined : options?.relatedGuides ?? defaultRelatedGuides;

  const buildDefaultAlsoHelpful = (): AlsoHelpfulConfig | undefined => {
    if (constants.ALSO_HELPFUL_TAGS.length === 0 && constants.RELATED_GUIDES.length === 0) {
      return undefined;
    }

    return {
      tags: [...constants.ALSO_HELPFUL_TAGS],
      excludeGuide: constants.RELATED_GUIDES.map((item) => item.key),
      includeRooms: true,
      section: DEFAULT_ALSO_HELPFUL_SECTION,
    } satisfies AlsoHelpfulConfig;
  };

  const alsoHelpful: AlsoHelpfulConfig | undefined = (() => {
    if (options?.alsoHelpful === null) return undefined;

    const base = buildDefaultAlsoHelpful();
    if (!options?.alsoHelpful) return base;

    const tags =
      options.alsoHelpful.tags !== undefined
        ? [...options.alsoHelpful.tags]
        : base?.tags ?? [...constants.ALSO_HELPFUL_TAGS];

    return {
      ...base,
      ...options.alsoHelpful,
      tags,
    } as AlsoHelpfulConfig | undefined;
  })();

  function HowToGuideComponent(): JSX.Element {
    const buildGuideExtras = useCallback(
      (context: GuideSeoTemplateContext) => guideExtras.createGuideExtras(context),
      [],
    );

    const resolvedArticleLead = useCallback(
      (context: GuideSeoTemplateContext) => {
        const extras = buildGuideExtras(context);
        return articleLead.renderArticleLead(context, extras);
      },
      [buildGuideExtras],
    );

    const buildTocItems = useCallback(
      (context: GuideSeoTemplateContext) => {
        const extras = buildGuideExtras(context);
        return selectors.selectTocItems(extras);
      },
      [buildGuideExtras],
    );

    const buildHowToSteps = useCallback(
      (context: GuideSeoTemplateContext) => {
        const extras = buildGuideExtras(context);
        return selectors.selectHowToSteps(extras);
      },
      [buildGuideExtras],
    );

    const resolvedGuideFaqFallback = useCallback(
      (targetLang: string) => guideFaqFallback.resolveGuideFaqFallback(targetLang),
      [],
    );

    const buildBreadcrumb = useCallback(
      (context: GuideSeoTemplateContext) => breadcrumb.buildBreadcrumb(context),
      [],
    );

    return (
      <GuideSeoTemplate
        guideKey={constants.GUIDE_KEY}
        metaKey={constants.GUIDE_KEY}
        ogImage={constants.OG_IMAGE}
        articleLead={resolvedArticleLead}
        buildTocItems={buildTocItems}
        buildHowToSteps={buildHowToSteps}
        buildBreadcrumb={buildBreadcrumb}
        guideFaqFallback={resolvedGuideFaqFallback}
        renderGenericContent={renderGenericContent}
        showPlanChoice={showPlanChoice}
        showTransportNotice={showTransportNotice}
        {...(relatedGuides !== undefined ? { relatedGuides } : {})}
        {...(alsoHelpful !== undefined ? { alsoHelpful } : {})}
      />
    );
  }

  const MemoizedComponent = memo(HowToGuideComponent);
  MemoizedComponent.displayName = `${String(constants.GUIDE_KEY)}HowToGuide`;

  return {
    component: MemoizedComponent,
    loader: loader.clientLoader,
  } satisfies HowToGuideFactoryResult<Loader>;
}

export type { HowToGuideOptions };
