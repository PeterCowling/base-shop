import {
  extractLinkLabels,
  filterContent,
  looksLikeCreditCard,
  looksLikeSsn,
  needsTokenization,
  restoreLinkTokensWithTranslatedLabels,
  restoreTokens,
  scanForPii,
  tokenize,
  validateTokenPreservation,
} from "../tokenization/index";

describe("tokenize", () => {
  describe("URLs", () => {
    it("tokenizes HTTP URLs", () => {
      const result = tokenize("Visit https://example.com for more info");
      expect(result.tokenizedText).toBe("Visit ⟦TU001⟧ for more info");
      expect(result.tokenMap.size).toBe(1);
      expect(result.tokenMap.get("⟦TU001⟧")?.original).toBe(
        "https://example.com"
      );
    });

    it("tokenizes multiple URLs", () => {
      const result = tokenize(
        "Check https://foo.com and http://bar.com/path?q=1"
      );
      expect(result.tokenizedText).toBe("Check ⟦TU001⟧ and ⟦TU002⟧");
      expect(result.tokenMap.size).toBe(2);
    });

    it("can disable URL tokenization", () => {
      const result = tokenize("Visit https://example.com", {
        tokenizeUrls: false,
      });
      expect(result.tokenizedText).toBe("Visit https://example.com");
      expect(result.hasTokens).toBe(false);
    });
  });

  describe("emails", () => {
    it("tokenizes email addresses", () => {
      const result = tokenize("Contact support@example.com for help");
      expect(result.tokenizedText).toBe("Contact ⟦TE001⟧ for help");
      expect(result.tokenMap.get("⟦TE001⟧")?.original).toBe(
        "support@example.com"
      );
    });

    it("tokenizes multiple emails", () => {
      const result = tokenize("Email a@b.com or c@d.org");
      expect(result.tokenizedText).toBe("Email ⟦TE001⟧ or ⟦TE002⟧");
    });
  });

  describe("i18next interpolations", () => {
    it("tokenizes {{var}} patterns", () => {
      const result = tokenize("Hello {{name}}, you have {{count}} messages");
      expect(result.tokenizedText).toBe("Hello ⟦TI001⟧, you have ⟦TI002⟧ messages");
    });

    it("tokenizes {{var, format}} patterns", () => {
      const result = tokenize("Price: {{amount, currency}}");
      expect(result.tokenizedText).toBe("Price: ⟦TI001⟧");
      expect(result.tokenMap.get("⟦TI001⟧")?.original).toBe(
        "{{amount, currency}}"
      );
    });
  });

  describe("ICU placeholders", () => {
    it("tokenizes {var} patterns", () => {
      const result = tokenize("Welcome {username}!", {
        tokenizeI18nextInterpolations: false, // Test ICU only
      });
      expect(result.tokenizedText).toBe("Welcome ⟦TJ001⟧!");
    });

    it("tokenizes {0} positional placeholders", () => {
      const result = tokenize("Item {0} of {1}", {
        tokenizeI18nextInterpolations: false,
      });
      expect(result.tokenizedText).toBe("Item ⟦TJ001⟧ of ⟦TJ002⟧");
    });
  });

  describe("Brikette guide links", () => {
    it("tokenizes %LINK:key|label% patterns", () => {
      const result = tokenize(
        "Check out %LINK:fornilloBeachGuide|Fornillo Beach% for swimming"
      );
      expect(result.tokenizedText).toBe("Check out ⟦TL001⟧ for swimming");

      const token = result.tokenMap.get("⟦TL001⟧");
      expect(token?.type).toBe("L");
      expect(token?.metadata).toEqual({
        type: "link",
        key: "fornilloBeachGuide",
        labelText: "Fornillo Beach",
      });
    });

    it("tokenizes multiple links", () => {
      const result = tokenize(
        "Visit %LINK:a|Place A% or %LINK:b|Place B%"
      );
      expect(result.tokenizedText).toBe("Visit ⟦TL001⟧ or ⟦TL002⟧");
      expect(result.tokenMap.size).toBe(2);
    });
  });

  describe("glossary terms", () => {
    it("tokenizes glossary terms", () => {
      const result = tokenize("Stay at Hostel Brikette in Positano", {
        glossaryTerms: [
          { source: "Hostel Brikette" },
          { source: "Positano" },
        ],
      });
      expect(result.tokenizedText).toBe("Stay at ⟦TG001⟧ in ⟦TG002⟧");
    });

    it("handles case-insensitive matching", () => {
      const result = tokenize("Visit POSITANO today", {
        glossaryTerms: [{ source: "Positano", caseSensitive: false }],
      });
      expect(result.tokenizedText).toBe("Visit ⟦TG001⟧ today");
    });

    it("handles whole word matching", () => {
      const result = tokenize("The Positano area is beautiful, unlike NotPositano", {
        glossaryTerms: [{ source: "Positano", matchWholeWord: true }],
      });
      // Should only match standalone "Positano", not "NotPositano"
      expect(result.tokenizedText).toBe("The ⟦TG001⟧ area is beautiful, unlike NotPositano");
    });
  });

  describe("escaping existing tokens", () => {
    it("escapes pre-existing token-like patterns", () => {
      const result = tokenize("Use ⟦TU001⟧ as a placeholder");
      expect(result.escapedPatterns).toContain("⟦TU001⟧");
      // The escaped version should use doubled brackets
      expect(result.tokenizedText).toContain("⟦⟦TU001⟧⟧");
    });
  });
});

describe("restoreTokens", () => {
  it("restores tokens in translated text", () => {
    const source = "Contact support@example.com for help";
    const { tokenizedText, tokenMap } = tokenize(source);

    // Simulate translation
    const translated = tokenizedText.replace("for help", "pour de l'aide");

    const result = restoreTokens(translated, tokenMap);
    expect(result.restoredText).toBe(
      "Contact support@example.com pour de l'aide"
    );
    expect(result.success).toBe(true);
  });

  it("reports missing tokens", () => {
    const { tokenMap } = tokenize("Email me at test@example.com");

    // Simulate translation that lost the token
    const translated = "Envoyez-moi un email";

    const result = restoreTokens(translated, tokenMap);
    expect(result.success).toBe(false);
    expect(result.failedTokens).toContain("⟦TE001⟧");
  });

  it("restores glossary terms with translations", () => {
    const { tokenizedText, tokenMap } = tokenize("Visit Positano today", {
      glossaryTerms: [
        {
          source: "Positano",
          translations: { it: "Positano", de: "Positano" },
        },
      ],
    });

    const result = restoreTokens(tokenizedText, tokenMap, "de");
    expect(result.restoredText).toBe("Visit Positano today");
  });
});

describe("validateTokenPreservation", () => {
  it("validates all tokens are present", () => {
    const { tokenizedText, tokenMap } = tokenize(
      "Email support@test.com or visit https://example.com"
    );

    const result = validateTokenPreservation(tokenMap, tokenizedText);
    expect(result.valid).toBe(true);
    expect(result.missingTokens).toHaveLength(0);
  });

  it("detects missing tokens", () => {
    const { tokenMap } = tokenize("Contact test@example.com");

    const result = validateTokenPreservation(tokenMap, "Contact us");
    expect(result.valid).toBe(false);
    expect(result.missingTokens).toContain("⟦TE001⟧");
  });
});

describe("extractLinkLabels", () => {
  it("extracts unique link labels", () => {
    const { tokenMap } = tokenize(
      "%LINK:a|Label A% and %LINK:b|Label B% and %LINK:c|Label A%"
    );

    const labels = extractLinkLabels(tokenMap);
    expect(labels).toHaveLength(2);
    expect(labels).toContain("Label A");
    expect(labels).toContain("Label B");
  });
});

describe("restoreLinkTokensWithTranslatedLabels", () => {
  it("restores links with translated labels", () => {
    const { tokenizedText, tokenMap } = tokenize(
      "Visit %LINK:beach|the beach% today"
    );

    const translatedLabels = new Map([["the beach", "la plage"]]);

    const result = restoreLinkTokensWithTranslatedLabels(
      tokenizedText,
      tokenMap,
      translatedLabels
    );
    expect(result).toBe("Visit %LINK:beach|la plage% today");
  });
});

describe("scanForPii", () => {
  it("detects SSN patterns with context", () => {
    const result = scanForPii("My SSN is 123-45-6789");
    expect(result.hasPii).toBe(true);
    expect(result.piiTypes).toContain("ssn");
    expect(result.blocked).toBe(true);
  });

  it("detects exact SSN format without context", () => {
    const result = scanForPii("Number: 123-45-6789");
    expect(result.hasPii).toBe(true);
    expect(result.blocked).toBe(true);
  });

  it("detects credit card numbers", () => {
    const result = scanForPii("Card: 4111-1111-1111-1111");
    expect(result.hasPii).toBe(true);
    expect(result.piiTypes).toContain("credit_card");
    expect(result.blocked).toBe(true);
  });

  it("does not flag normal numbers", () => {
    const result = scanForPii("Room 123 is available");
    expect(result.hasPii).toBe(false);
    expect(result.blocked).toBe(false);
  });

  it("does not flag invalid credit card numbers", () => {
    // This fails Luhn check
    const result = scanForPii("Number: 1234567890123456");
    expect(result.piiTypes).not.toContain("credit_card");
  });
});

describe("looksLikeCreditCard", () => {
  it("returns true for valid Visa", () => {
    expect(looksLikeCreditCard("4111111111111111")).toBe(true);
  });

  it("returns true for valid MasterCard", () => {
    expect(looksLikeCreditCard("5500000000000004")).toBe(true);
  });

  it("returns false for invalid number", () => {
    expect(looksLikeCreditCard("1234567890123456")).toBe(false);
  });

  it("handles formatted numbers", () => {
    expect(looksLikeCreditCard("4111-1111-1111-1111")).toBe(true);
    expect(looksLikeCreditCard("4111 1111 1111 1111")).toBe(true);
  });
});

describe("looksLikeSsn", () => {
  it("returns true for XXX-XX-XXXX format", () => {
    expect(looksLikeSsn("123-45-6789")).toBe(true);
  });

  it("returns true for 9 consecutive digits", () => {
    expect(looksLikeSsn("123456789")).toBe(true);
  });

  it("returns false for other formats", () => {
    expect(looksLikeSsn("12345")).toBe(false);
    expect(looksLikeSsn("12-345-6789")).toBe(false);
  });
});

describe("filterContent", () => {
  it("passes clean content", () => {
    const result = filterContent("Hello, welcome to our store!");
    expect(result.passed).toBe(true);
    expect(result.validationErrors).toHaveLength(0);
  });

  it("tokenizes emails and URLs", () => {
    const result = filterContent("Email support@test.com or visit https://example.com");
    expect(result.passed).toBe(true);
    expect(result.tokenization?.hasTokens).toBe(true);
    expect(result.tokenization?.tokenMap.size).toBe(2);
  });

  it("blocks content with PII", () => {
    const result = filterContent("My SSN is 123-45-6789");
    expect(result.passed).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({ code: "blocked_pii" })
    );
  });

  it("validates string length", () => {
    const longText = "a".repeat(15000);
    const result = filterContent(longText);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({ code: "too_long" })
    );
  });

  it("can customize max string length", () => {
    const text = "a".repeat(100);
    const result = filterContent(text, { maxStringLength: 50 });
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({ code: "too_long" })
    );
  });

  it("detects unclosed HTML tags", () => {
    const result = filterContent("<p>Hello <strong>world");
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({ code: "malformed_markup" })
    );
  });

  it("detects unbalanced interpolation brackets", () => {
    const result = filterContent("Hello {{name} world");
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({ code: "malformed_markup" })
    );
  });
});

describe("needsTokenization", () => {
  it("returns true for text with emails", () => {
    expect(needsTokenization("Contact test@example.com")).toBe(true);
  });

  it("returns true for text with URLs", () => {
    expect(needsTokenization("Visit https://example.com")).toBe(true);
  });

  it("returns true for text with interpolations", () => {
    expect(needsTokenization("Hello {{name}}")).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(needsTokenization("Hello world")).toBe(false);
  });
});
