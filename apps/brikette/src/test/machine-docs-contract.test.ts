import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import yaml from "js-yaml";

const PUBLIC_DIR = path.join(__dirname, "../../public");

describe("Machine-readable documents contract", () => {
  describe("OpenAPI spec (openapi.yaml)", () => {
    it("parses without errors", () => {
      const filePath = path.join(PUBLIC_DIR, ".well-known/openapi.yaml");
      expect(existsSync(filePath)).toBe(true);

      const content = readFileSync(filePath, "utf8");
      const spec = yaml.load(content) as Record<string, unknown>;

      expect(spec).toBeDefined();
      expect(spec.openapi).toBe("3.1.0");
      expect(spec.info).toBeDefined();
    });

    it("only lists existing endpoints", () => {
      const filePath = path.join(PUBLIC_DIR, ".well-known/openapi.yaml");
      const content = readFileSync(filePath, "utf8");
      const spec = yaml.load(content) as Record<string, unknown>;

      const paths = spec.paths as Record<string, unknown>;
      const endpoints = Object.keys(paths);

      // After TASK-SEO-5: only /data/rates.json should remain
      expect(endpoints).toEqual(["/data/rates.json"]);

      // Verify /data/rates.json file exists
      const ratesPath = path.join(PUBLIC_DIR, "data/rates.json");
      expect(existsSync(ratesPath)).toBe(true);
    });

    it("has valid info and servers configuration", () => {
      const filePath = path.join(PUBLIC_DIR, ".well-known/openapi.yaml");
      const content = readFileSync(filePath, "utf8");
      const spec = yaml.load(content) as Record<string, unknown>;

      const info = spec.info as Record<string, unknown>;
      expect(info.title).toBeDefined();
      expect(info.version).toBeDefined();
      expect(info.description).toBeDefined();

      const servers = spec.servers as Array<Record<string, unknown>>;
      expect(servers).toBeDefined();
      expect(servers.length).toBeGreaterThan(0);
      expect(servers[0].url).toBe("https://hostel-positano.com");
    });
  });

  describe("AI plugin manifest (ai-plugin.json)", () => {
    it("parses without errors", () => {
      const filePath = path.join(PUBLIC_DIR, ".well-known/ai-plugin.json");
      expect(existsSync(filePath)).toBe(true);

      const content = readFileSync(filePath, "utf8");
      const plugin = JSON.parse(content) as Record<string, unknown>;

      expect(plugin).toBeDefined();
      expect(plugin.schema_version).toBe("v1");
    });

    it("references valid URLs", () => {
      const filePath = path.join(PUBLIC_DIR, ".well-known/ai-plugin.json");
      const content = readFileSync(filePath, "utf8");
      const plugin = JSON.parse(content) as Record<string, unknown>;

      // Verify logo URL points to existing file
      const logoUrl = plugin.logo_url as string;
      expect(logoUrl).toBe("https://hostel-positano.com/android-chrome-512x512.png");

      const logoPath = path.join(PUBLIC_DIR, "android-chrome-512x512.png");
      expect(existsSync(logoPath)).toBe(true);

      // Verify legal info URL is valid (fixed in TASK-SEO-5)
      const legalUrl = plugin.legal_info_url as string;
      expect(legalUrl).toBe("https://hostel-positano.com/en/terms");

      // Verify API URL points to existing OpenAPI spec
      const api = plugin.api as Record<string, unknown>;
      expect(api.url).toBe("https://hostel-positano.com/.well-known/openapi.yaml");

      const openapiPath = path.join(PUBLIC_DIR, ".well-known/openapi.yaml");
      expect(existsSync(openapiPath)).toBe(true);
    });

    it("has valid plugin metadata", () => {
      const filePath = path.join(PUBLIC_DIR, ".well-known/ai-plugin.json");
      const content = readFileSync(filePath, "utf8");
      const plugin = JSON.parse(content) as Record<string, unknown>;

      expect(plugin.name_for_human).toBeDefined();
      expect(plugin.name_for_model).toBeDefined();
      expect(plugin.description_for_human).toBeDefined();
      expect(plugin.description_for_model).toBeDefined();
      expect(plugin.contact_email).toBeDefined();
    });
  });

  describe("llms.txt", () => {
    it("parses without errors", () => {
      const filePath = path.join(PUBLIC_DIR, "llms.txt");
      expect(existsSync(filePath)).toBe(true);

      const content = readFileSync(filePath, "utf8");
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
    });

    it("references only existing files", () => {
      const filePath = path.join(PUBLIC_DIR, "llms.txt");
      const content = readFileSync(filePath, "utf8");

      // Extract paths from llms.txt (paths start with / inside markdown links)
      const pathMatches = content.matchAll(/\[.*?\]\((\/[^)]+)\)/g);
      const paths = Array.from(pathMatches).map((match) => match[1]);

      expect(paths.length).toBeGreaterThan(0);

      // Verify each referenced file exists
      for (const urlPath of paths) {
        // Remove leading slash and construct local path
        const localPath = path.join(PUBLIC_DIR, urlPath.replace(/^\//, ""));

        // Special case: .well-known paths
        if (urlPath.startsWith("/.well-known/")) {
          expect(existsSync(localPath)).toBe(true);
          continue;
        }

        // Schema files are generated at build time (postbuild script)
        // They may not exist in test environment before build
        if (urlPath.startsWith("/schema/")) {
          // Skip validation - generator will create these at build time
          continue;
        }

        // Data files
        if (urlPath.startsWith("/data/")) {
          expect(existsSync(localPath)).toBe(true);
          continue;
        }

        // Sitemap files (generated by TASK-SEO-7, may not exist in test environment)
        if (urlPath.includes("sitemap")) {
          // Skip validation for sitemap files in test (generated at build time)
          continue;
        }

        // If we get here, file should exist
        expect(existsSync(localPath)).toBe(true);
      }
    });

    it("includes all expected machine-readable sources", () => {
      const filePath = path.join(PUBLIC_DIR, "llms.txt");
      const content = readFileSync(filePath, "utf8");

      // After TASK-SEO-7, llms.txt should reference schema files
      expect(content).toContain("/schema/hostel-brikette/graph.jsonld");
      expect(content).toContain("/schema/hostel-brikette/hotel.jsonld");
      expect(content).toContain("/schema/hostel-brikette/rooms.jsonld");
      expect(content).toContain("/schema/hostel-brikette/offers.jsonld");
      expect(content).toContain("/schema/hostel-brikette/faq.jsonld");
      expect(content).toContain("/schema/hostel-brikette/guide-tags.jsonld");

      // Core machine docs
      expect(content).toContain("/data/rates.json");
      expect(content).toContain("/.well-known/openapi.yaml");
      expect(content).toContain("/.well-known/ai-plugin.json");

      // Sitemap (generated by TASK-SEO-7)
      expect(content).toContain("/sitemap_index.xml");
    });
  });

  describe("Schema files (generated by TASK-SEO-7)", () => {
    it("all referenced schema files exist", () => {
      const schemaDir = path.join(PUBLIC_DIR, "schema/hostel-brikette");

      // Note: Schema files are copied by generator at build time
      // In CI, generator runs in postbuild, so files may not exist during test
      // This test validates the contract when files ARE present

      const expectedSchemaFiles = [
        "graph.jsonld",
        "hotel.jsonld",
        "rooms.jsonld",
        "offers.jsonld",
        "faq.jsonld",
        "guide-tags.jsonld",
      ];

      for (const fileName of expectedSchemaFiles) {
        const filePath = path.join(schemaDir, fileName);
        // Only validate if schema directory exists (postbuild has run)
        if (existsSync(schemaDir)) {
          expect(existsSync(filePath)).toBe(true);

          // Verify it's valid JSON-LD
          const content = readFileSync(filePath, "utf8");
          const jsonld = JSON.parse(content) as Record<string, unknown>;
          expect(jsonld["@context"]).toBeDefined();
        }
      }
    });
  });
});
