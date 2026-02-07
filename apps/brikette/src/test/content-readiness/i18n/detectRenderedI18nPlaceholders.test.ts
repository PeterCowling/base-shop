import {
  detectRenderedI18nPlaceholders,
  formatI18nPlaceholderReport,
  type PlaceholderFinding,
} from "@tests/utils/detectRenderedI18nPlaceholders";

describe("detectRenderedI18nPlaceholders", () => {
  describe("raw key detection", () => {
    it("detects content.* keys", () => {
      const text = "Welcome to content.cheapEats.intro our restaurant guide";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(1);
      expect(findings[0].value).toBe("content.cheapEats.intro");
      expect(findings[0].kind).toBe("rawKey");
    });

    it("detects pages.* keys", () => {
      const text = "The title is pages.rooms.title here";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(1);
      expect(findings[0].value).toBe("pages.rooms.title");
      expect(findings[0].kind).toBe("rawKey");
    });

    it("detects guides.* keys", () => {
      const text = "guides.pathOfTheGods.sections";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(1);
      expect(findings[0].value).toBe("guides.pathOfTheGods.sections");
    });

    it("detects multiple keys in the same text", () => {
      const text =
        "First content.foo.bar then components.header.title and pages.home.hero";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(3);
      expect(findings.map((f) => f.value)).toEqual([
        "content.foo.bar",
        "components.header.title",
        "pages.home.hero",
      ]);
    });

    it("detects deeply nested keys", () => {
      const text = "content.guides.pathOfTheGods.sections.highlights.title";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(1);
      expect(findings[0].value).toBe(
        "content.guides.pathOfTheGods.sections.highlights.title"
      );
    });

    it("requires at least 2 dot segments by default", () => {
      const text = "Just content alone or footer alone";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(0);
    });

    it("respects custom minDotSegments option", () => {
      const text = "content.title is short but content.foo.bar.baz is long";
      const findings = detectRenderedI18nPlaceholders(text, {
        minDotSegments: 3,
      });

      expect(findings).toHaveLength(1);
      expect(findings[0].value).toBe("content.foo.bar.baz");
    });
  });

  describe("false positive prevention", () => {
    it("ignores URLs", () => {
      const text = "Visit https://example.com/path.to/resource.html for more";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(0);
    });

    it("ignores email addresses", () => {
      const text = "Contact user.name@example.com for help";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(0);
    });

    it("ignores file paths", () => {
      const text = "See ./path/to/file.ts or /absolute/path.json";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(0);
    });

    it("ignores version numbers", () => {
      const text = "Using version 1.2.3 of the library";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(0);
    });

    it("ignores IP addresses", () => {
      const text = "Server at 192.168.1.100";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(0);
    });

    it("ignores values in allowlist", () => {
      const text = "The content.allowed.key is fine";
      const findings = detectRenderedI18nPlaceholders(text, {
        allowlist: ["content.allowed.key"],
      });

      expect(findings).toHaveLength(0);
    });

    it("ignores values with allowlisted prefixes", () => {
      const text =
        "Both content.legacy.foo and content.legacy.bar are ignored";
      const findings = detectRenderedI18nPlaceholders(text, {
        allowlistPrefixes: ["content.legacy."],
      });

      expect(findings).toHaveLength(0);
    });

    it("does not flag normal English text with periods", () => {
      const text = "Welcome to Positano. We hope you enjoy your stay.";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(0);
    });

    it("does not flag text with spaces between segments", () => {
      const text = "The content of the page. The title is great.";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(0);
    });
  });

  describe("placeholder phrase detection", () => {
    it("detects Italian placeholder phrase", () => {
      const text = "The intro is: Traduzione in arrivo.";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(1);
      expect(findings[0].value).toBe("Traduzione in arrivo.");
      expect(findings[0].kind).toBe("placeholderPhrase");
    });

    it("detects English placeholder phrase", () => {
      const text = "Translation in progress";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(1);
      expect(findings[0].kind).toBe("placeholderPhrase");
    });

    it("detects Polish placeholder phrase", () => {
      const text = "Tłumaczenie w przygotowaniu.";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(1);
      expect(findings[0].kind).toBe("placeholderPhrase");
    });

    it("detects German placeholder phrase", () => {
      const text = "Übersetzung in Arbeit.";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(1);
      expect(findings[0].kind).toBe("placeholderPhrase");
    });

    it("detects Japanese placeholder phrase", () => {
      const text = "翻訳準備中";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(1);
      expect(findings[0].kind).toBe("placeholderPhrase");
    });

    it("detects Chinese placeholder phrase", () => {
      const text = "翻译进行中";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(1);
      expect(findings[0].kind).toBe("placeholderPhrase");
    });
  });

  describe("mixed detection", () => {
    it("detects both raw keys and placeholder phrases", () => {
      const text = `
        The title is content.cheapEats.title
        And the intro says: Traduzione in arrivo.
        Check pages.rooms.description for more.
      `;
      const findings = detectRenderedI18nPlaceholders(text);

      const rawKeys = findings.filter((f) => f.kind === "rawKey");
      const phrases = findings.filter((f) => f.kind === "placeholderPhrase");

      expect(rawKeys).toHaveLength(2);
      expect(phrases).toHaveLength(1);
    });

    it("deduplicates repeated occurrences", () => {
      const text =
        "content.foo.bar appears here and content.foo.bar appears again";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings).toHaveLength(1);
    });
  });

  describe("snippet generation", () => {
    it("includes context around the finding", () => {
      const text = "Some leading text content.foo.bar some trailing text";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings[0].snippet).toContain("content.foo.bar");
      expect(findings[0].snippet.length).toBeGreaterThan(
        "content.foo.bar".length
      );
    });

    it("handles findings at the start of text", () => {
      const text = "content.foo.bar is at the start";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings[0].snippet).toContain("content.foo.bar");
    });

    it("handles findings at the end of text", () => {
      const text = "At the end is content.foo.bar";
      const findings = detectRenderedI18nPlaceholders(text);

      expect(findings[0].snippet).toContain("content.foo.bar");
    });
  });

  describe("custom key prefixes", () => {
    it("uses custom prefixes when provided", () => {
      const text = "custom.namespace.key should be detected";
      const findings = detectRenderedI18nPlaceholders(text, {
        keyPrefixes: ["custom."],
      });

      expect(findings).toHaveLength(1);
      expect(findings[0].value).toBe("custom.namespace.key");
    });

    it("ignores default prefixes when custom prefixes are provided", () => {
      // content.* is a default prefix, but we're overriding with custom prefixes
      const text = "content.foo.bar should not be detected with custom prefix";
      const findings = detectRenderedI18nPlaceholders(text, {
        keyPrefixes: ["custom."],
      });

      // content.foo.bar won't match because:
      // 1. It doesn't start with "custom."
      // 2. It doesn't have camelCase segments (for the fallback detection)
      expect(findings).toHaveLength(0);
    });
  });
});

describe("formatI18nPlaceholderReport", () => {
  it("returns success message when no findings", () => {
    const report = formatI18nPlaceholderReport([]);

    expect(report).toBe("No i18n placeholder issues detected.");
  });

  it("formats findings with counts", () => {
    const findings: PlaceholderFinding[] = [
      { value: "content.foo.bar", kind: "rawKey", snippet: "...content.foo.bar..." },
      { value: "pages.home.title", kind: "rawKey", snippet: "...pages.home.title..." },
    ];
    const report = formatI18nPlaceholderReport(findings);

    expect(report).toContain("Found 2 potential i18n issue(s)");
    expect(report).toContain("content.foo.bar");
    expect(report).toContain("pages.home.title");
  });

  it("groups by kind when option is enabled", () => {
    const findings: PlaceholderFinding[] = [
      { value: "content.foo.bar", kind: "rawKey", snippet: "..." },
      { value: "Traduzione in arrivo.", kind: "placeholderPhrase", snippet: "..." },
    ];
    const report = formatI18nPlaceholderReport(findings, { groupByKind: true });

    expect(report).toContain("Raw keys (1):");
    expect(report).toContain("Placeholder phrases (1):");
  });

  it("truncates output when maxFindings is exceeded", () => {
    const findings: PlaceholderFinding[] = Array.from({ length: 25 }, (_, i) => ({
      value: `content.key${i}.value`,
      kind: "rawKey" as const,
      snippet: "...",
    }));
    const report = formatI18nPlaceholderReport(findings, { maxFindings: 10 });

    expect(report).toContain("... and 15 more");
  });

  it("respects maxSnippetLength option", () => {
    const longSnippet = "A".repeat(100);
    const findings: PlaceholderFinding[] = [
      { value: "content.foo.bar", kind: "rawKey", snippet: longSnippet },
    ];
    const report = formatI18nPlaceholderReport(findings, {
      maxSnippetLength: 20,
    });

    // The snippet in the report should be truncated
    const snippetMatch = report.match(/Context: "(.+)"/);
    expect(snippetMatch?.[1]?.length).toBeLessThanOrEqual(20);
  });
});
