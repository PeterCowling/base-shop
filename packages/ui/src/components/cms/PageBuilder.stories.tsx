import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { useEffect, useMemo, useState } from "react";
import type { Page, PageComponent } from "@acme/types";
import PageBuilder from "./page-builder/PageBuilder";
import type { PageBuilderProps } from "./page-builder/PageBuilder.types";

// i18n-exempt -- story fixtures for Page Builder flows; copy is demo-only

type PBStory = StoryObj<typeof PageBuilder>;

const nowIso = "2025-01-01T00:00:00.000Z";

const baseSeo = (title: string): Page["seo"] =>
  ({
    title: { en: title },
    description: {},
    image: {},
    brand: {},
    offers: {},
    aggregateRating: {},
  }) as Page["seo"];

const basePage = (id: string, slug: string, title: string, components: PageComponent[]): Page => ({
  id,
  slug,
  status: "draft",
  components,
  seo: baseSeo(title),
  createdAt: nowIso,
  updatedAt: nowIso,
  createdBy: "storybook",
});

const heroSection: PageComponent = {
  id: "sec-hero",
  type: "Section",
  children: [
    {
      id: "hero",
      type: "HeroBanner",
      title: { en: "Launch your shop faster" },
      subtitle: { en: "Use blocks and templates to compose pages in minutes." },
      ctaLabel: { en: "Shop now" },
      ctaHref: "/shop",
    } as unknown as PageComponent,
  ],
} as unknown as PageComponent;

const productsSection: PageComponent = {
  id: "sec-products",
  type: "Section",
  children: [
    {
      id: "grid",
      type: "ProductGrid",
      mode: "collection",
      query: { kind: "collection", handle: "featured" },
    } as unknown as PageComponent,
  ],
} as unknown as PageComponent;

const valuePropsSection: PageComponent = {
  id: "sec-value-props",
  type: "Section",
  children: [
    {
      id: "vp",
      type: "ValueProps",
      items: [
        { id: "vp1", title: { en: "Fast delivery" }, description: { en: "2–3 day shipping on most items." } },
        { id: "vp2", title: { en: "Easy returns" }, description: { en: "Hassle-free returns within 30 days." } },
      ],
    } as unknown as PageComponent,
  ],
} as unknown as PageComponent;

const checkoutShellSection: PageComponent = {
  id: "sec-checkout-shell",
  type: "Section",
  children: [
    {
      id: "checkout-section",
      type: "CheckoutSection",
      showWallets: true,
      showBNPL: true,
    } as unknown as PageComponent,
    {
      id: "checkout-cart",
      type: "CartSection",
      showPromo: true,
      showGiftCard: true,
      showLoyalty: true,
    } as unknown as PageComponent,
  ],
} as unknown as PageComponent;

const localeSection: PageComponent = {
  id: "sec-locale",
  type: "Section",
  children: [
    {
      id: "locale-text",
      type: "Text",
      text: {
        en: "This hero is localised. Switch locale in the toolbar to see different copy.",
        de: "Dieser Hero ist lokalisiert. Wechseln Sie die Sprache in der Toolbar, um anderen Text zu sehen.",
        it: "Questo hero è localizzato. Cambia lingua nella toolbar per vedere un testo diverso.",
      },
    } as unknown as PageComponent,
  ],
} as unknown as PageComponent;

const meta: Meta<typeof PageBuilder> = {
  title: "CMS/PageBuilder",
  component: PageBuilder,
  tags: ["dev", "test", "pb-flow"],
  args: {
    onSave: fn(async () => {}),
    onPublish: fn(async () => {}),
  },
  parameters: {
    docs: {
      description: {
        component:
          "Interactive Page Builder playground backed by the real block registry and MSW-backed product/cart APIs. Use these flows to exercise add/reorder, style editing, templates, locale/device preview, and checkout composition.",
      },
    },
  },
};

export default meta;

export const AddAndReorder: PBStory = {
  name: "Add & Reorder blocks",
  args: {
    page: basePage("pb-add-reorder", "builder-add-reorder", "Add & Reorder", [heroSection, productsSection]),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Start from a simple hero + product grid layout. Use the palette to drag additional blocks into the page and drag existing blocks within the Section to verify reordering and drop-target hints.",
      },
    },
  },
};

export const StyleEditing: PBStory = {
  name: "Style edit & layout",
  args: {
    page: basePage("pb-style-edit", "builder-style-edit", "Style editing", [valuePropsSection]),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Focus on a Section with ValueProps and open the inspector to tweak spacing, background, and typography. This story is ideal for validating style panel changes without additional blocks.",
      },
    },
  },
};

export const TemplateApply: PBStory = {
  name: "Template apply (section presets)",
  args: {
    page: basePage("pb-template-apply", "builder-template-apply", "Apply template", []),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Begin with an empty page and use the **Add Section** / presets entry in the palette to insert a prefab section (for example, “Hero: Simple”). This exercises the shared presets pipeline and insert handlers.",
      },
    },
  },
};

export const LocaleAndDevicePreview: PBStory = {
  name: "Locale & device preview",
  args: {
    page: {
      ...basePage("pb-locale-device", "builder-locale-device", "Locale & device preview", [heroSection, localeSection]),
      seo: {
        title: {
          en: "Homepage – EN",
          de: "Startseite – DE",
          it: "Homepage – IT",
        },
        description: {},
        image: {},
        brand: {},
        offers: {},
        aggregateRating: {},
      } as Page["seo"],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use the Page Builder toolbar to switch between locales and devices (desktop/tablet/mobile). Copy in the hero and body text is localised so you can visually verify locale and viewport changes.",
      },
    },
  },
};

export const CheckoutComposition: PBStory = {
  name: "Checkout composition",
  args: {
    page: basePage("pb-checkout", "builder-checkout", "Checkout composition", [checkoutShellSection]),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Compose a minimal checkout-focused page using CheckoutSection and CartSection plus supporting blocks. Product and cart data come from Storybook’s MSW handlers so you can safely add items and exercise cart flows.",
      },
    },
  },
};

const socialProofSection: PageComponent = {
  id: "sec-social-proof",
  type: "Section",
  children: [
    {
      id: "social-proof",
      type: "SocialProof",
      rating: { rating: 4.7, count: 182 },
      testimonials: [
        {
          id: "sp-1",
          quote: { en: "Fast shipping and the product quality was excellent." },
          name: { en: "Amira K." },
        },
        {
          id: "sp-2",
          quote: { en: "The layout and imagery made checkout feel trustworthy." },
          name: { en: "Jae M." },
        },
      ],
      logos: [
        { src: "https://placehold.co/120x40/svg?text=GLOW", alt: "Glow Co." },
        { src: "https://placehold.co/120x40/svg?text=PEAK", alt: "Peak Digital" },
      ],
    } as unknown as PageComponent,
  ],
} as unknown as PageComponent;

const matrixPage = basePage("pb-visual-matrix", "builder-visual-matrix", "Visual matrix", [
  heroSection,
  productsSection,
  valuePropsSection,
  socialProofSection,
  checkoutShellSection,
]);

export const VisualMatrix: PBStory = {
  name: "Visual matrix (key blocks)",
  args: {
    page: matrixPage,
  },
  tags: ["visual"],
  parameters: {
    docs: {
      description: {
        story:
          "Snapshot of the core hero → grid → value props → social proof → checkout shell stack. Use this for quick visual scans of critical blocks and to verify palette/registry wiring end to end.",
      },
    },
  },
};

function PageBuilderPerfProbe(props: PageBuilderProps & { blocksCount: number }) {
  const start = useMemo(
    () => (typeof performance !== "undefined" ? performance.now() : Date.now()),
    [],
  );
  const [renderMs, setRenderMs] = useState<number | null>(null);

  useEffect(() => {
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const duration = end - start;
    setRenderMs(duration);
    // eslint-disable-next-line no-console
    console.info(`[PB perf] Rendered ${props.blocksCount} blocks in ${duration.toFixed(1)}ms`);
  }, [props.blocksCount, start]);

  return (
    <div className="grid gap-3">
      <div className="text-xs text-muted-foreground">
        {renderMs === null
          ? `Measuring initial render for ${props.blocksCount} blocks…`
          : `Initial render: ${renderMs.toFixed(1)}ms for ${props.blocksCount} blocks (Page Builder canvas + palette).`}
      </div>
      <PageBuilder {...props} />
    </div>
  );
}

const perfPage = basePage(
  "pb-perf-50",
  "builder-perf-50",
  "Perf probe (50 blocks)",
  Array.from({ length: 50 }).map((_, idx) => ({
    id: `sec-perf-${idx + 1}`,
    type: "Section",
    children: [
      {
        id: `text-perf-${idx + 1}`,
        type: "Text",
        text: { en: `Performance block #${idx + 1}` },
      } as unknown as PageComponent,
    ],
  })) as PageComponent[],
);

export const PerfProbe50Blocks: PBStory = {
  name: "Perf probe (50 blocks)",
  args: { page: perfPage },
  render: (args) => (
    <PageBuilderPerfProbe
      {...args}
      blocksCount={Array.isArray(args.page.components) ? args.page.components.length : 0}
    />
  ),
  tags: ["perf"],
  parameters: {
    docs: {
      description: {
        story:
          "Perf guardrail: renders a 50-section page (text-only) and logs initial render time in the console. Use to spot regressions in palette/canvas rendering.",
      },
    },
    perf: { blocks: 50 },
    chromatic: { disable: true },
  },
};
