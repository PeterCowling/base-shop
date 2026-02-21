import { buildAiPluginManifest, buildLlmsTxt } from "../ai/index.js";

describe("buildLlmsTxt", () => {
  // TC-05: llms.txt format
  it("produces valid llms.txt markdown", () => {
    const result = buildLlmsTxt({
      siteName: "Test Site",
      description: "A test description",
      sources: [
        { title: "API Spec", url: "/openapi.yaml" },
        { title: "Sitemap", url: "/sitemap.xml" },
      ],
    });

    expect(result).toMatch(/^# Test Site$/m);
    expect(result).toContain("> A test description");
    expect(result).toContain("## Machine-readable sources");
    expect(result).toContain("- [API Spec](/openapi.yaml)");
    expect(result).toContain("- [Sitemap](/sitemap.xml)");
  });

  it("includes optional context sections", () => {
    const result = buildLlmsTxt({
      siteName: "My Site",
      description: "Desc",
      sources: [],
      contextSections: [
        { heading: "Key locations", content: "Rome, Florence, Venice" },
      ],
    });

    expect(result).toContain("## Key locations");
    expect(result).toContain("Rome, Florence, Venice");
  });

  it("handles empty sources list", () => {
    const result = buildLlmsTxt({
      siteName: "Minimal",
      description: "Minimal site",
      sources: [],
    });

    expect(result).toMatch(/^# Minimal$/m);
    expect(result).toContain("> Minimal site");
    expect(result).toContain("## Machine-readable sources");
  });

  it("includes source descriptions when provided", () => {
    const result = buildLlmsTxt({
      siteName: "Site",
      description: "Desc",
      sources: [
        {
          title: "Daily rates",
          url: "/data/rates.json",
          description: "6-month calendar, hourly updates",
        },
      ],
    });

    expect(result).toContain(
      "- [Daily rates](/data/rates.json) \u2014 6-month calendar, hourly updates",
    );
  });
});

describe("buildAiPluginManifest", () => {
  // TC-06: ai-plugin.json v1 schema
  it("returns object with schema_version v1 and all required fields", () => {
    const result = buildAiPluginManifest({
      nameForHuman: "My Plugin",
      nameForModel: "my_plugin",
      descriptionForHuman: "A helpful plugin.",
      descriptionForModel: "Plugin for reading data.",
      api: { url: "https://example.com/.well-known/openapi.yaml" },
      logoUrl: "https://example.com/logo.png",
      contactEmail: "info@example.com",
      legalInfoUrl: "https://example.com/terms",
    });

    expect(result).toHaveProperty("schema_version", "v1");
    expect(result).toHaveProperty("name_for_human", "My Plugin");
    expect(result).toHaveProperty("name_for_model", "my_plugin");
    expect(result).toHaveProperty("description_for_human", "A helpful plugin.");
    expect(result).toHaveProperty(
      "description_for_model",
      "Plugin for reading data.",
    );
    expect(result).toHaveProperty("auth", { type: "none" });
    expect(result).toHaveProperty("api");
    expect((result as Record<string, unknown>).api).toEqual({
      type: "openapi",
      url: "https://example.com/.well-known/openapi.yaml",
      is_user_authenticated: false,
    });
    expect(result).toHaveProperty("logo_url", "https://example.com/logo.png");
    expect(result).toHaveProperty("contact_email", "info@example.com");
    expect(result).toHaveProperty(
      "legal_info_url",
      "https://example.com/terms",
    );
  });

  it("supports custom auth type", () => {
    const result = buildAiPluginManifest({
      nameForHuman: "Auth Plugin",
      nameForModel: "auth_plugin",
      descriptionForHuman: "Secure plugin.",
      descriptionForModel: "Secure plugin for reading protected data.",
      api: { url: "https://example.com/openapi.yaml" },
      logoUrl: "https://example.com/logo.png",
      contactEmail: "info@example.com",
      legalInfoUrl: "https://example.com/terms",
      authType: "user_http",
    });

    expect(result).toHaveProperty("auth", { type: "user_http" });
  });
});
