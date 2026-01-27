import { describe, expect, it } from "@jest/globals";

// Token extraction and validation functions will be exported from the script
type TokenMatch = {
  type: "LINK" | "HOWTO" | "URL";
  target: string;
  label: string;
  line?: number;
};

type ValidationResult = {
  valid: boolean;
  error?: string;
  suggestion?: string;
};

// Mock implementation for testing - will be replaced with actual imports
const TOKEN_PATTERN = /%([A-Z]+):([^|%]+)\|([^%]+)%/g;

function extractTokens(content: string): TokenMatch[] {
  const tokens: TokenMatch[] = [];
  const lines = content.split("\n");

  lines.forEach((line, lineIndex) => {
    const regex = new RegExp(TOKEN_PATTERN);
    let match;
    while ((match = regex.exec(line)) !== null) {
      const [, type, target, label] = match;
      if (type && target && label) {
        tokens.push({
          type: type as "LINK" | "HOWTO" | "URL",
          target: target.trim(),
          label: label.trim(),
          line: lineIndex + 1,
        });
      }
    }
  });

  return tokens;
}

function validateLinkToken(
  target: string,
  validKeys: Set<string>
): ValidationResult {
  if (validKeys.has(target)) {
    return { valid: true };
  }

  // Find close matches for suggestions
  const targetLower = target.toLowerCase();
  const closeMatches = Array.from(validKeys).filter((key) =>
    key.toLowerCase().includes(targetLower.slice(0, 4))
  );

  return {
    valid: false,
    error: `Guide key "${target}" not found in manifest`,
    suggestion: closeMatches.length > 0 ? closeMatches[0] : undefined,
  };
}

function validateHowtoToken(
  target: string,
  validSlugs: Set<string>
): ValidationResult {
  if (validSlugs.has(target)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `HOWTO slug "${target}" not found in route definitions or guide slugs`,
  };
}

function validateUrlToken(target: string): ValidationResult {
  const trimmed = target.trim().toLowerCase();

  // Security check: disallow javascript: and data: URLs
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:")) {
    return {
      valid: false,
      error: `Unsafe URL protocol detected: ${trimmed.split(":")[0]}:`,
    };
  }

  // Only allow http, https, mailto
  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    !trimmed.startsWith("mailto:")
  ) {
    return {
      valid: false,
      error: `Invalid URL protocol. Must be http://, https://, or mailto:`,
    };
  }

  return { valid: true };
}

describe("Link token validation", () => {
  describe("extractTokens", () => {
    it("extracts LINK tokens from content", () => {
      const content = "Check out %LINK:pathOfTheGods|Path of the Gods%!";
      const tokens = extractTokens(content);

      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toMatchObject({
        type: "LINK",
        target: "pathOfTheGods",
        label: "Path of the Gods",
        line: 1,
      });
    });

    it("extracts HOWTO tokens from content", () => {
      const content = "See %HOWTO:napoli-positano|Naples to Positano%.";
      const tokens = extractTokens(content);

      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toMatchObject({
        type: "HOWTO",
        target: "napoli-positano",
        label: "Naples to Positano",
      });
    });

    it("extracts URL tokens from content", () => {
      const content = "Visit %URL:https://example.com|our website%.";
      const tokens = extractTokens(content);

      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toMatchObject({
        type: "URL",
        target: "https://example.com",
        label: "our website",
      });
    });

    it("extracts multiple tokens from multiline content", () => {
      const content = `Line 1: %LINK:guide1|Guide One%
Line 2: %HOWTO:route-1|Route%
Line 3: %URL:https://test.com|Test%`;

      const tokens = extractTokens(content);

      expect(tokens).toHaveLength(3);
      expect(tokens[0]?.line).toBe(1);
      expect(tokens[1]?.line).toBe(2);
      expect(tokens[2]?.line).toBe(3);
    });

    it("handles content with no tokens", () => {
      const content = "Plain text with no tokens.";
      const tokens = extractTokens(content);

      expect(tokens).toHaveLength(0);
    });

    it("trims whitespace from target and label", () => {
      const content = "%LINK: guideKey | Label Text %";
      const tokens = extractTokens(content);

      expect(tokens[0]).toMatchObject({
        target: "guideKey",
        label: "Label Text",
      });
    });
  });

  describe("validateLinkToken", () => {
    const validKeys = new Set(["pathOfTheGods", "cuisineGuide", "beaches"]);

    it("validates existing guide key", () => {
      const result = validateLinkToken("pathOfTheGods", validKeys);
      expect(result.valid).toBe(true);
    });

    it("rejects non-existent guide key", () => {
      const result = validateLinkToken("nonExistent", validKeys);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Guide key "nonExistent" not found');
    });

    it("provides suggestion for close matches", () => {
      const result = validateLinkToken("pathOfGods", validKeys);
      expect(result.valid).toBe(false);
      expect(result.suggestion).toBe("pathOfTheGods");
    });

    it("handles case-insensitive suggestions", () => {
      const result = validateLinkToken("PATH", validKeys);
      expect(result.valid).toBe(false);
      expect(result.suggestion).toBe("pathOfTheGods");
    });
  });

  describe("validateHowtoToken", () => {
    const validSlugs = new Set([
      "napoli-positano",
      "salerno-positano",
      "aeroporto-napoli",
    ]);

    it("validates existing HOWTO slug", () => {
      const result = validateHowtoToken("napoli-positano", validSlugs);
      expect(result.valid).toBe(true);
    });

    it("rejects non-existent HOWTO slug", () => {
      const result = validateHowtoToken("non-existent-route", validSlugs);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("HOWTO slug");
    });
  });

  describe("validateUrlToken", () => {
    it("validates http URLs", () => {
      const result = validateUrlToken("http://example.com");
      expect(result.valid).toBe(true);
    });

    it("validates https URLs", () => {
      const result = validateUrlToken("https://example.com/path");
      expect(result.valid).toBe(true);
    });

    it("validates mailto URLs", () => {
      const result = validateUrlToken("mailto:test@example.com");
      expect(result.valid).toBe(true);
    });

    it("rejects javascript: URLs (security)", () => {
      const result = validateUrlToken("javascript:alert('xss')");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unsafe URL protocol");
    });

    it("rejects data: URLs (security)", () => {
      const result = validateUrlToken("data:text/html,<script>alert('xss')</script>");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unsafe URL protocol");
    });

    it("rejects invalid protocols", () => {
      const result = validateUrlToken("ftp://example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid URL protocol");
    });

    it("rejects malformed URLs", () => {
      const result = validateUrlToken("not-a-url");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid URL protocol");
    });
  });
});
