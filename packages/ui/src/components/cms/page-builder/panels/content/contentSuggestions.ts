// i18n-exempt file — editor-only suggestions UI; copy pending i18n wiring
import enMessages from "@acme/i18n/en.json";
import type { ImageComponent,PageComponent , TextComponent } from "@acme/types";

export interface ContentSuggestion {
  id: string;
  label: string;
  description?: string;
  apply: (component: PageComponent) => Partial<PageComponent>;
}

function toTitleCase(input: string | undefined): string | undefined {
  if (!input) return input;
  return input
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function filenameToAlt(src?: string): string | undefined {
  if (!src) return undefined;
  try {
    const file = src.split("/").pop() || src;
    const base = file.replace(/\.[a-zA-Z0-9]+$/, "");
    const words = base.replace(/[\-_]+/g, " ").trim();
    return toTitleCase(words) || undefined;
  } catch {
    return undefined;
  }
}

type Translator = (key: string) => string;

export function getContentSuggestions(
  component: PageComponent,
  tArg?: Translator,
): ContentSuggestion[] {
  const t: Translator = tArg ?? ((key) => (enMessages as Record<string, string>)[key] ?? key);
  const suggestions: ContentSuggestion[] = [];

  if (component.type === "Text") {
    const text = (component as TextComponent).text;
    suggestions.push(
      {
        id: "text-punchy-headline",
        label: t("cms.builder.suggestions.text.punchyHeadline.label"),
        description: t("cms.builder.suggestions.text.punchyHeadline.description"),
        apply: () => {
          const src = text || t("cms.builder.suggestions.text.punchyHeadline.defaultSource");
          const shortened = src.length > 60 ? `${src.slice(0, 57).trim()}...` : src;
          return { text: shortened } as Partial<PageComponent>;
        },
      },
      {
        id: "text-insert-lorem",
        label: t("cms.builder.suggestions.text.insertLorem.label"),
        description: t("cms.builder.suggestions.text.insertLorem.description"),
        apply: () =>
          ({ text: t("cms.builder.suggestions.text.insertLorem.placeholder") } as Partial<PageComponent>),
      },
      {
        id: "text-title-case",
        label: t("cms.builder.suggestions.text.titleCase.label"),
        description: t("cms.builder.suggestions.text.titleCase.description"),
        apply: () => ({ text: toTitleCase(text) } as Partial<PageComponent>),
      },
    );
  }

  if (component.type === "Button") {
    suggestions.push(
      {
        id: "btn-primary-buy",
        label: t("cms.builder.suggestions.button.primaryBuy.label"),
        description: t("cms.builder.suggestions.button.primaryBuy.description"),
        apply: () =>
          ({ label: "Buy Now", variant: "default", size: "lg" } as Partial<PageComponent>),
      },
      {
        id: "btn-secondary-learn",
        label: t("cms.builder.suggestions.button.secondaryLearn.label"),
        description: t("cms.builder.suggestions.button.secondaryLearn.description"),
        apply: () =>
          ({ label: "Learn More", variant: "outline", size: "md" } as Partial<PageComponent>),
      },
      {
        id: "btn-contact",
        label: t("cms.builder.suggestions.button.contact.label"),
        description: t("cms.builder.suggestions.button.contact.description"),
        apply: () => ({ label: "Contact Us", href: "/contact" } as Partial<PageComponent>),
      },
    );
  }

  if (component.type === "Image") {
    const src = (component as ImageComponent).src;
    suggestions.push(
      {
        id: "img-square",
        label: t("cms.builder.suggestions.image.squareAspect.label"),
        description: t("cms.builder.suggestions.image.squareAspect.description"),
        apply: () => ({ cropAspect: "1:1" } as Partial<PageComponent>),
      },
      {
        id: "img-widescreen",
        label: t("cms.builder.suggestions.image.widescreenAspect.label"),
        description: t("cms.builder.suggestions.image.widescreenAspect.description"),
        apply: () => ({ cropAspect: "16:9" } as Partial<PageComponent>),
      },
      {
        id: "img-center-focal",
        label: t("cms.builder.suggestions.image.centerFocal.label"),
        description: t("cms.builder.suggestions.image.centerFocal.description"),
        apply: () => ({ focalPoint: { x: 0.5, y: 0.5 } } as Partial<PageComponent>),
      },
      {
        id: "img-alt-from-name",
        label: t("cms.builder.suggestions.image.altFromFilename.label"),
        description: t("cms.builder.suggestions.image.altFromFilename.description"),
        apply: () => ({ alt: filenameToAlt(src) } as Partial<PageComponent>),
      },
    );
  }

  return suggestions;
}
