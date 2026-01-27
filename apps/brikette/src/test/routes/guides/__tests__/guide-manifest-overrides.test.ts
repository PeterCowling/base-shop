import {
  createManifestOverride,
  manifestOverrideSchema,
  manifestOverridesSchema,
  safeParseManifestOverride,
  safeParseManifestOverrides,
  validateManifestOverride,
  validateManifestOverrides,
} from "@/routes/guides/guide-manifest-overrides";

describe("guide-manifest-overrides schema", () => {
  describe("manifestOverrideSchema", () => {
    it("accepts valid override with areas and primaryArea", () => {
      const result = manifestOverrideSchema.safeParse({
        areas: ["help", "experience"],
        primaryArea: "help",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.areas).toEqual(["help", "experience"]);
        expect(result.data.primaryArea).toBe("help");
      }
    });

    it("accepts override with only areas", () => {
      const result = manifestOverrideSchema.safeParse({
        areas: ["howToGetHere"],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.areas).toEqual(["howToGetHere"]);
        expect(result.data.primaryArea).toBeUndefined();
      }
    });

    it("accepts override with only primaryArea", () => {
      const result = manifestOverrideSchema.safeParse({
        primaryArea: "experience",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.primaryArea).toBe("experience");
        expect(result.data.areas).toBeUndefined();
      }
    });

    it("accepts empty override object", () => {
      const result = manifestOverrideSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects primaryArea not in areas when both provided", () => {
      const result = manifestOverrideSchema.safeParse({
        areas: ["help"],
        primaryArea: "experience",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "primaryArea must be included in areas when both are provided",
        );
      }
    });

    it("rejects empty areas array", () => {
      const result = manifestOverrideSchema.safeParse({
        areas: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid area value", () => {
      const result = manifestOverrideSchema.safeParse({
        areas: ["invalidArea"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid primaryArea value", () => {
      const result = manifestOverrideSchema.safeParse({
        primaryArea: "invalidArea",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all valid area values", () => {
      const result = manifestOverrideSchema.safeParse({
        areas: ["howToGetHere", "help", "experience"],
        primaryArea: "help",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("manifestOverridesSchema", () => {
    it("accepts valid overrides record", () => {
      const result = manifestOverridesSchema.safeParse({
        someGuide: { areas: ["help"], primaryArea: "help" },
        anotherGuide: { areas: ["experience"] },
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty overrides record", () => {
      const result = manifestOverridesSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects invalid entry in overrides record", () => {
      const result = manifestOverridesSchema.safeParse({
        validGuide: { areas: ["help"] },
        invalidGuide: { areas: ["help"], primaryArea: "experience" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("validateManifestOverride", () => {
    it("returns validated data for valid input", () => {
      const result = validateManifestOverride({
        areas: ["help"],
        primaryArea: "help",
      });
      expect(result).toEqual({ areas: ["help"], primaryArea: "help" });
    });

    it("throws for invalid input", () => {
      expect(() =>
        validateManifestOverride({ areas: ["help"], primaryArea: "experience" }),
      ).toThrow();
    });
  });

  describe("validateManifestOverrides", () => {
    it("returns validated data for valid input", () => {
      const result = validateManifestOverrides({
        testGuide: { areas: ["experience"] },
      });
      expect(result).toEqual({ testGuide: { areas: ["experience"] } });
    });

    it("throws for invalid input", () => {
      expect(() =>
        validateManifestOverrides({
          testGuide: { areas: [] },
        }),
      ).toThrow();
    });
  });

  describe("safeParseManifestOverride", () => {
    it("returns success result for valid input", () => {
      const result = safeParseManifestOverride({ areas: ["help"] });
      expect(result.success).toBe(true);
    });

    it("returns error result for invalid input", () => {
      const result = safeParseManifestOverride({ areas: [] });
      expect(result.success).toBe(false);
    });
  });

  describe("safeParseManifestOverrides", () => {
    it("returns success result for valid input", () => {
      const result = safeParseManifestOverrides({
        guide: { areas: ["experience"], primaryArea: "experience" },
      });
      expect(result.success).toBe(true);
    });

    it("returns error result for invalid input", () => {
      const result = safeParseManifestOverrides({
        guide: { primaryArea: "invalidValue" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createManifestOverride", () => {
    it("creates override with explicit primaryArea", () => {
      const result = createManifestOverride(["help", "experience"], "experience");
      expect(result).toEqual({ areas: ["help", "experience"], primaryArea: "experience" });
    });

    it("defaults primaryArea to first area when not specified", () => {
      const result = createManifestOverride(["howToGetHere", "help"]);
      expect(result).toEqual({ areas: ["howToGetHere", "help"], primaryArea: "howToGetHere" });
    });

    it("throws when areas is empty", () => {
      expect(() => createManifestOverride([])).toThrow("areas must contain at least one area");
    });

    it("throws when primaryArea not in areas", () => {
      expect(() => createManifestOverride(["help"], "experience")).toThrow(
        "primaryArea must be included in areas",
      );
    });
  });
});
