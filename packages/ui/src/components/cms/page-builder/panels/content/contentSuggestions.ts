import type { PageComponent } from "@acme/types";

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
    const text = (component as any).text as string | undefined;
    suggestions.push(
      {
        id: "text-punchy-headline",
        label: "Punchy headline",
        description: "Shorten and add impact to the text",
        apply: () => {
          const src = text || "Discover Exceptional Quality";
          const shortened = src.length > 60 ? `${src.slice(0, 57).trim()}...` : src;
          return { text: shortened } as any;
        },
      },
      {
        id: "text-insert-lorem",
        label: "Insert lorem",
        description: "Fill with placeholder copy",
        apply: () => ({ text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." } as any),
      },
      {
        id: "text-title-case",
        label: "Title case",
        description: "Capitalize each word",
        apply: () => ({ text: toTitleCase(text) } as any),
      },
    );
  }

  if (component.type === "Button") {
    suggestions.push(
      {
        id: "btn-primary-buy",
        label: "Primary • Buy Now",
        description: "Set a primary call to action",
        apply: () => ({ label: "Buy Now", variant: "default", size: "lg" } as any),
      },
      {
        id: "btn-secondary-learn",
        label: "Secondary • Learn More",
        description: "Outline style informational CTA",
        apply: () => ({ label: "Learn More", variant: "outline", size: "md" } as any),
      },
      {
        id: "btn-contact",
        label: "CTA • Contact Us",
        description: "Link to contact page",
        apply: () => ({ label: "Contact Us", href: "/contact" } as any),
      },
    );
  }

  if (component.type === "Image") {
    const src = (component as any).src as string | undefined;
    suggestions.push(
      {
        id: "img-square",
        label: "Aspect • 1:1",
        description: "Square crop",
        apply: () => ({ cropAspect: "1:1" } as any),
      },
      {
        id: "img-widescreen",
        label: "Aspect • 16:9",
        description: "Widescreen crop",
        apply: () => ({ cropAspect: "16:9" } as any),
      },
      {
        id: "img-center-focal",
        label: "Center focal point",
        description: "Set focal point to center",
        apply: () => ({ focalPoint: { x: 0.5, y: 0.5 } } as any),
      },
      {
        id: "img-alt-from-name",
        label: "Alt from filename",
        description: "Generate alt text",
        apply: () => ({ alt: filenameToAlt(src) } as any),
      },
    );
  }

  return suggestions;
}

