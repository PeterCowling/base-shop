// i18n-exempt file — editor-only suggestions UI; copy pending i18n wiring
import type { PageComponent } from "@acme/types";
import type { TextComponent, ImageComponent } from "@acme/types";

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

export function getContentSuggestions(component: PageComponent): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];

  if (component.type === "Text") {
    const text = (component as TextComponent).text;
    suggestions.push(
      {
        id: "text-punchy-headline",
        label: "Punchy headline",
        description: "Shorten and add impact to the text",
        apply: () => {
          const src = text || "Discover Exceptional Quality";
          const shortened = src.length > 60 ? `${src.slice(0, 57).trim()}...` : src;
          return { text: shortened } as Partial<PageComponent>;
        },
      },
      {
        id: "text-insert-lorem",
        label: "Insert lorem",
        description: "Fill with placeholder copy",
        apply: () =>
          ({ text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." } as Partial<PageComponent>),
      },
      {
        id: "text-title-case",
        label: "Title case",
        description: "Capitalize each word",
        apply: () => ({ text: toTitleCase(text) } as Partial<PageComponent>),
      },
    );
  }

  if (component.type === "Button") {
    suggestions.push(
      {
        id: "btn-primary-buy",
        label: "Primary • Buy Now",
        description: "Set a primary call to action",
        apply: () =>
          ({ label: "Buy Now", variant: "default", size: "lg" } as Partial<PageComponent>),
      },
      {
        id: "btn-secondary-learn",
        label: "Secondary • Learn More",
        description: "Outline style informational CTA",
        apply: () =>
          ({ label: "Learn More", variant: "outline", size: "md" } as Partial<PageComponent>),
      },
      {
        id: "btn-contact",
        label: "CTA • Contact Us",
        description: "Link to contact page",
        apply: () => ({ label: "Contact Us", href: "/contact" } as Partial<PageComponent>),
      },
    );
  }

  if (component.type === "Image") {
    const src = (component as ImageComponent).src;
    suggestions.push(
      {
        id: "img-square",
        label: "Aspect • 1:1",
        description: "Square crop",
        apply: () => ({ cropAspect: "1:1" } as Partial<PageComponent>),
      },
      {
        id: "img-widescreen",
        label: "Aspect • 16:9",
        description: "Widescreen crop",
        apply: () => ({ cropAspect: "16:9" } as Partial<PageComponent>),
      },
      {
        id: "img-center-focal",
        label: "Center focal point",
        description: "Set focal point to center",
        apply: () => ({ focalPoint: { x: 0.5, y: 0.5 } } as Partial<PageComponent>),
      },
      {
        id: "img-alt-from-name",
        label: "Alt from filename",
        description: "Generate alt text",
        apply: () => ({ alt: filenameToAlt(src) } as Partial<PageComponent>),
      },
    );
  }

  return suggestions;
}
