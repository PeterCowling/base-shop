import { describe, expect, it } from "@jest/globals";
import { guideContentSchema } from "@/routes/guides/content-schema";

/**
 * Content readiness guardrail: guide content JSON must conform to the shared Zod schema.
 */
describe("guideContentSchema", () => {
  describe("valid content", () => {
    it("accepts minimal valid content with required seo fields", () => {
      const validContent = {
        seo: {
          title: "Test Guide",
          description: "A test guide description",
        },
      };

      const result = guideContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
    });

    it("accepts content with optional intro (object format)", () => {
      const validContent = {
        seo: {
          title: "Test Guide",
          description: "A test guide description",
        },
        intro: {
          title: "Introduction",
          body: "This is the introduction text.",
        },
      };

      const result = guideContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
    });

    it("accepts content with optional intro (array format)", () => {
      const validContent = {
        seo: {
          title: "Test Guide",
          description: "A test guide description",
        },
        intro: ["Paragraph one.", "Paragraph two."],
      };

      const result = guideContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
    });

    it("accepts content with optional intro (string format)", () => {
      const validContent = {
        seo: {
          title: "Test Guide",
          description: "A test guide description",
        },
        intro: "Single paragraph introduction.",
      };

      const result = guideContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
    });

    it("accepts content with optional sections array", () => {
      const validContent = {
        seo: {
          title: "Test Guide",
          description: "A test guide description",
        },
        sections: [
          {
            id: "section-1",
            title: "Section One",
            body: "Section body text",
          },
          {
            id: "section-2",
            title: "Section Two",
            // body is optional
          },
          {
            id: "section-3",
            title: "Section Three",
            list: ["Item 1", "Item 2"],
          },
        ],
      };

      const result = guideContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
    });

    it("accepts content with section images", () => {
      const validContent = {
        seo: {
          title: "Test Guide",
          description: "A test guide description",
        },
        sections: [
          {
            id: "section-1",
            title: "Section One",
            body: "Section body text",
            images: [
              {
                src: "/img/guides/test.jpg",
                alt: "Test image alt text",
                caption: "Test image caption",
              },
            ],
          },
        ],
      };

      const result = guideContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
      if (result.success) {
        const section = result.data.sections?.[0];
        expect(section).toBeTruthy();
        expect(section?.images).toEqual([
          {
            src: "/img/guides/test.jpg",
            alt: "Test image alt text",
            caption: "Test image caption",
          },
        ]);
      }
    });

    it("accepts content with optional faqs array", () => {
      const validContent = {
        seo: {
          title: "Test Guide",
          description: "A test guide description",
        },
        faqs: [
          {
            q: "Question one?",
            a: ["Answer one."],
          },
          {
            q: "Question two?",
            a: ["Answer paragraph one.", "Answer paragraph two."],
          },
        ],
      };

      const result = guideContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
    });

    it("accepts content with optional callouts object", () => {
      const validContent = {
        seo: {
          title: "Test Guide",
          description: "A test guide description",
        },
        callouts: {
          tip: "This is a helpful tip",
          warning: "Be careful about this",
        },
      };

      const result = guideContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
    });

    it("accepts extra fields via passthrough", () => {
      const validContent = {
        seo: {
          title: "Test Guide",
          description: "A test guide description",
        },
        essentialsTitle: "Essentials",
        essentials: ["Item 1", "Item 2"],
      };

      const result = guideContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty("essentialsTitle");
        expect(result.data).toHaveProperty("essentials");
      }
    });
  });

  describe("invalid content", () => {
    it("rejects content missing seo object", () => {
      const invalidContent = {
        intro: { title: "Intro", body: "Text" },
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it("rejects content with empty seo.title", () => {
      const invalidContent = {
        seo: {
          title: "",
          description: "Description",
        },
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it("rejects content with whitespace-only seo.title", () => {
      const invalidContent = {
        seo: {
          title: "   ",
          description: "Description",
        },
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it("rejects content with empty seo.description", () => {
      const invalidContent = {
        seo: {
          title: "Title",
          description: "",
        },
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it("rejects content with missing seo.title", () => {
      const invalidContent = {
        seo: {
          description: "Description",
        },
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it("rejects intro object with missing body", () => {
      const invalidContent = {
        seo: {
          title: "Title",
          description: "Description",
        },
        intro: {
          title: "Intro title",
          // missing body
        },
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it("rejects intro array with empty strings", () => {
      const invalidContent = {
        seo: {
          title: "Title",
          description: "Description",
        },
        intro: ["Valid paragraph", ""],
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it("rejects sections with missing id", () => {
      const invalidContent = {
        seo: {
          title: "Title",
          description: "Description",
        },
        sections: [
          {
            // missing id
            title: "Section",
            body: "Text",
          },
        ],
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it("rejects sections with missing title", () => {
      const invalidContent = {
        seo: {
          title: "Title",
          description: "Description",
        },
        sections: [
          {
            id: "section-1",
            // missing title
            body: "Text",
          },
        ],
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it("rejects section images missing required fields", () => {
      const invalidContent = {
        seo: {
          title: "Title",
          description: "Description",
        },
        sections: [
          {
            id: "section-1",
            title: "Section",
            body: "Text",
            images: [
              {
                // missing src + alt
                caption: "Caption only",
              },
            ],
          },
        ],
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it("rejects faqs with missing q", () => {
      const invalidContent = {
        seo: {
          title: "Title",
          description: "Description",
        },
        faqs: [
          {
            // missing q
            a: ["Answer"],
          },
        ],
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it("rejects faqs with missing a", () => {
      const invalidContent = {
        seo: {
          title: "Title",
          description: "Description",
        },
        faqs: [
          {
            q: "Question?",
            // missing a
          },
        ],
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it("rejects callouts with empty string values", () => {
      const invalidContent = {
        seo: {
          title: "Title",
          description: "Description",
        },
        callouts: {
          tip: "",
        },
      };

      const result = guideContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });
  });

  describe("opt-out mechanism", () => {
    it("accepts _schemaValidation flag via passthrough", () => {
      const contentWithOptOut = {
        _schemaValidation: false,
        seo: {
          title: "Valid title",
          description: "Valid description",
        },
      };

      // Schema validates as normal; the validation script will check _schemaValidation flag
      const result = guideContentSchema.safeParse(contentWithOptOut);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty("_schemaValidation", false);
      }
    });

    it("schema still validates even when _schemaValidation is false", () => {
      const invalidContentWithOptOut = {
        _schemaValidation: false,
        seo: {
          // missing required fields
        },
      };

      // Schema always validates; opt-out is handled by validation script, not schema
      const result = guideContentSchema.safeParse(invalidContentWithOptOut);
      expect(result.success).toBe(false);
    });
  });
});
