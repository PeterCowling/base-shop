import matter from "gray-matter";

import type { Card } from "@acme/platform-core/repositories/businessOs.server";

import { computeEntitySha } from "../entity-sha";

import { serializeCard } from "./serializer";

async function buildCard(overrides: Partial<Card> = {}): Promise<Card> {
  const base: Card = {
    Type: "Card",
    ID: "BRIK-ENG-0001",
    Lane: "Inbox",
    Priority: "P1",
    Owner: "Pete",
    Business: "BRIK",
    Title: "Café ☕ émoji",
    Created: "2026-02-02",
    content: `# Heading

First paragraph.

Second paragraph.
`,
    filePath: "docs/business-os/cards/BRIK-ENG-0001.user.md",
  };

  const cardBase: Card = { ...base, ...overrides };
  const { fileSha: _ignored, ...hashInput } = cardBase as Record<
    string,
    unknown
  >;
  const fileSha = await computeEntitySha(hashInput);
  return { ...cardBase, fileSha };
}

function normalizeRoundTripContent(content: string): string {
  const withoutLeading = content.replace(/^\n/, "");
  const unix = withoutLeading.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = unix
    .split("\n")
    .map((line) => line.replace(/[\t ]+$/g, ""));
  const trimmed = lines.join("\n").replace(/\n+$/g, "");
  return `${trimmed}\n`;
}

function normalizeParsedFrontmatter(
  data: Record<string, unknown>
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      normalized[key] = value.toISOString().slice(0, 10);
      continue;
    }
    normalized[key] = value;
  }
  return normalized;
}


function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = sortKeysDeep(record[key]);
    }
    return sorted;
  }

  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

describe("serializeCard", () => {
  it("TC-01: produces deterministic output", async () => {
    const card = await buildCard();
    const first = serializeCard(card).userMd;
    const second = serializeCard(card).userMd;

    expect(first).toBe(second);
  });

  it("TC-02: YAML keys are alphabetical", async () => {
    const card = await buildCard({
      Tags: ["zeta", "alpha"],
      "Due-Date": "2026-02-03",
    });
    const output = serializeCard(card).userMd;
    const lines = output.split("\n");
    const endIndex = lines.indexOf("---", 1);
    const frontmatterLines = lines.slice(1, endIndex);
    const keys = frontmatterLines
      .filter((line) => line && !line.startsWith(" ") && !line.startsWith("-"))
      .map((line) => line.split(":")[0]);
    const sorted = [...keys].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()) || a.localeCompare(b)
    );

    expect(keys).toEqual(sorted);
  });

  it("TC-03: normalizes dates to YYYY-MM-DD", async () => {
    const card = await buildCard({
      Created: "2026-02-02T14:30:00Z",
    });
    const output = serializeCard(card).userMd;

    expect(output).toContain("Created: 2026-02-02");
  });

  it("TC-04: omits null/undefined fields", async () => {
    const card = (await buildCard()) as Card & Record<string, unknown>;
    card.Priority = null;

    const output = serializeCard(card as Card).userMd;

    expect(output).not.toContain("Priority:");
  });

  it("TC-05: round-trip preserves payload_json", async () => {
    const card = await buildCard({
      Created: "2026-02-02",
    });
    const output = serializeCard(card).userMd;
    const parsed = matter(output);

    const roundTrip: Card = {
      ...normalizeParsedFrontmatter(parsed.data as Record<string, unknown>),
      content: normalizeRoundTripContent(parsed.content),
      filePath: card.filePath,
    } as Card;

    const { fileSha: _ignored, ...hashInput } = roundTrip as Record<
      string,
      unknown
    >;
    const fileSha = await computeEntitySha(hashInput);
    const roundTripPayload = { ...roundTrip, fileSha };

    expect(stableStringify(roundTripPayload)).toBe(stableStringify(card));
  });

  it("TC-06: preserves unicode", async () => {
    const card = await buildCard({
      Title: "Café ☕ émoji",
      content: `Café ☕ — résumé
`,
    });
    const output = serializeCard(card).userMd;

    expect(output).toContain("Café ☕ émoji");
    expect(output).toContain("Café ☕ — résumé");
  });

  it("TC-07: uses unix line endings", async () => {
    const card = await buildCard();
    const output = serializeCard(card).userMd;

    expect(output).not.toContain("\r\n");
  });

  it("TC-08: has no trailing whitespace", async () => {
    const card = await buildCard({
      content: `Line with space   
Line with tab	
`,
    });
    const output = serializeCard(card).userMd;

    for (const line of output.split("\n")) {
      expect(line).toBe(line.trimEnd());
    }
  });
});
