import { parseSeoForm } from "../parseSeoForm";

describe("parseSeoForm", () => {
  it("parses full data", () => {
    const fd = new FormData();
    fd.set("locale", "en");
    fd.set("title", "My title");
    fd.set("description", "desc");
    fd.set("image", "https://example.com/img.png");
    fd.set("alt", "alt text");
    fd.set("canonicalBase", "https://example.com");
    fd.set("ogUrl", "https://example.com/og");
    fd.set("twitterCard", "summary");

    const result = parseSeoForm(fd);
    expect(result.data).toEqual({
      locale: "en",
      title: "My title",
      description: "desc",
      image: "https://example.com/img.png",
      alt: "alt text",
      canonicalBase: "https://example.com",
      ogUrl: "https://example.com/og",
      twitterCard: "summary",
    });
  });

  it("requires title", () => {
    const fd = new FormData();
    fd.set("locale", "en");
    fd.set("title", "");

    const result = parseSeoForm(fd);
    expect(result.errors).toHaveProperty("title");
  });

  it("validates url fields", () => {
    const fd = new FormData();
    fd.set("locale", "en");
    fd.set("title", "t");
    fd.set("image", "not-a-url");
    fd.set("canonicalBase", "also-bad");

    const result = parseSeoForm(fd);
    expect(result.errors).toHaveProperty("image");
    expect(result.errors).toHaveProperty("canonicalBase");
  });

  it("enforces twitterCard enumeration", () => {
    const fd = new FormData();
    fd.set("locale", "en");
    fd.set("title", "t");
    fd.set("twitterCard", "invalid");

    const result = parseSeoForm(fd);
    expect(result.errors).toHaveProperty("twitterCard");
  });
});
