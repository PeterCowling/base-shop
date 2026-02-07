// packages/ui/src/components/cms/page-builder/panels/content/__tests__/contentSuggestions.test.ts
import { getContentSuggestions } from "../../content/contentSuggestions";

describe("contentSuggestions", () => {
  test("text suggestions include punchy, lorem, and title case", () => {
    const sugg = getContentSuggestions({ type: "Text", text: "hello world from cms" } as any);
    const ids = sugg.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining([
      "text-punchy-headline",
      "text-insert-lorem",
      "text-title-case",
    ]));
    // Title case applies capitalization (allow extra words)
    const title = sugg.find((s) => s.id === "text-title-case")!;
    const res = title.apply({ type: "Text", text: "hello world" } as any) as any;
    expect(typeof res.text).toBe("string");
    expect(String(res.text)).toEqual(expect.stringContaining("Hello World"));
  });

  test("button suggestions set variants and href", () => {
    const sugg = getContentSuggestions({ type: "Button" } as any);
    const primary = sugg.find((s) => s.id === "btn-primary-buy")!;
    const secondary = sugg.find((s) => s.id === "btn-secondary-learn")!;
    const contact = sugg.find((s) => s.id === "btn-contact")!;
    expect(primary.apply({ type: "Button" } as any)).toMatchObject({ label: "Buy Now", variant: "default" });
    expect(secondary.apply({ type: "Button" } as any)).toMatchObject({ label: "Learn More", variant: "outline" });
    expect(contact.apply({ type: "Button" } as any)).toMatchObject({ href: "/contact" });
  });

  test("image suggestions include alt text from filename and aspect presets", () => {
    const sugg = getContentSuggestions({ type: "Image", src: "https://cdn/x/foo-bar.jpg" } as any);
    const alt = sugg.find((s) => s.id === "img-alt-from-name")!;
    expect(alt.apply({ type: "Image", src: "https://cdn/x/foo-bar.jpg" } as any)).toMatchObject({ alt: "Foo Bar" });
    const square = sugg.find((s) => s.id === "img-square")!;
    const wide = sugg.find((s) => s.id === "img-widescreen")!;
    expect(square.apply({ type: "Image" } as any)).toMatchObject({ cropAspect: "1:1" });
    expect(wide.apply({ type: "Image" } as any)).toMatchObject({ cropAspect: "16:9" });
  });
});
