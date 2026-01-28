import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { createRepoReader } from "./repo-reader";
import type { CardFrontmatter, IdeaFrontmatter } from "./types";

/* eslint-disable max-lines-per-function -- BOS-08: comprehensive test coverage requires extended setup */
describe("RepoReader", () => {
  let tempDir: string;
  let businessOsPath: string;
  let reader: ReturnType<typeof createRepoReader>;

  beforeEach(async () => {
    // Create temporary directory structure
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "business-os-test-"));
    businessOsPath = path.join(tempDir, "docs/business-os");

    await fs.mkdir(path.join(businessOsPath, "ideas/inbox/archive"), {
      recursive: true,
    });
    await fs.mkdir(path.join(businessOsPath, "ideas/worked/archive"), {
      recursive: true,
    });
    await fs.mkdir(path.join(businessOsPath, "cards/archive"), {
      recursive: true,
    });
    await fs.mkdir(path.join(businessOsPath, "strategy"), { recursive: true });

    // Create business catalog
    const catalog = {
      businesses: [
        {
          id: "PLAT",
          name: "Platform",
          description: "Core platform",
          owner: "Pete",
          status: "active",
          created: "2026-01-28",
          tags: ["infrastructure"],
        },
        {
          id: "BRIK",
          name: "Brikette",
          description: "E-commerce platform",
          owner: "Pete",
          status: "active",
          created: "2026-01-28",
          tags: ["e-commerce"],
        },
      ],
      metadata: { version: "1.0.0", lastUpdated: "2026-01-28", format: "v1" },
    };
    await fs.writeFile(
      path.join(businessOsPath, "strategy/businesses.json"),
      JSON.stringify(catalog, null, 2)
    );

    reader = createRepoReader(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("getBusinessCatalog", () => {
    it("reads and parses business catalog", async () => {
      const catalog = await reader.getBusinessCatalog();

      expect(catalog.businesses).toHaveLength(2);
      expect(catalog.businesses[0].id).toBe("PLAT");
      expect(catalog.businesses[1].id).toBe("BRIK");
      expect(catalog.metadata.version).toBe("1.0.0");
    });
  });

  describe("getBusiness", () => {
    it("returns business by ID", async () => {
      const business = await reader.getBusiness("BRIK");

      expect(business).not.toBeNull();
      expect(business?.name).toBe("Brikette");
      expect(business?.owner).toBe("Pete");
    });

    it("returns null for non-existent business", async () => {
      const business = await reader.getBusiness("INVALID");
      expect(business).toBeNull();
    });
  });

  describe("getBusinesses", () => {
    it("returns all businesses", async () => {
      const businesses = await reader.getBusinesses();

      expect(businesses).toHaveLength(2);
      expect(businesses.map((b) => b.id)).toEqual(["PLAT", "BRIK"]);
    });
  });

  describe("getCard", () => {
    beforeEach(async () => {
      // Create a card
      const cardContent = `---
Type: Card
Lane: In progress
Priority: P1
Owner: Pete
ID: BRIK-OPP-0001
Title: Test Card
Business: BRIK
Tags: [test, feature]
---

# Test Card

Card content here.
`;
      await fs.writeFile(
        path.join(businessOsPath, "cards/BRIK-OPP-0001.user.md"),
        cardContent
      );
    });

    it("reads and parses a card", async () => {
      const card = await reader.getCard("BRIK-OPP-0001");

      expect(card).not.toBeNull();
      expect(card?.ID).toBe("BRIK-OPP-0001");
      expect(card?.Lane).toBe("In progress");
      expect(card?.Priority).toBe("P1");
      expect(card?.Owner).toBe("Pete");
      expect(card?.Title).toBe("Test Card");
      expect(card?.Business).toBe("BRIK");
      expect(card?.Tags).toEqual(["test", "feature"]);
      expect(card?.content).toContain("# Test Card");
    });

    it("returns null for non-existent card", async () => {
      const card = await reader.getCard("INVALID-0001");
      expect(card).toBeNull();
    });

    it("reads card from archive if not in main directory", async () => {
      const archivedContent = `---
Type: Card
Lane: Done
Priority: P2
Owner: Pete
ID: BRIK-OPP-0002
---

Archived card.
`;
      await fs.writeFile(
        path.join(businessOsPath, "cards/archive/BRIK-OPP-0002.user.md"),
        archivedContent
      );

      const card = await reader.getCard("BRIK-OPP-0002");

      expect(card).not.toBeNull();
      expect(card?.ID).toBe("BRIK-OPP-0002");
      expect(card?.Lane).toBe("Done");
    });
  });

  describe("queryCards", () => {
    beforeEach(async () => {
      // Create multiple cards
      const cards: Array<{ id: string; frontmatter: CardFrontmatter }> = [
        {
          id: "BRIK-OPP-0001",
          frontmatter: {
            Type: "Card",
            Lane: "In progress",
            Priority: "P1",
            Owner: "Pete",
            ID: "BRIK-OPP-0001",
            Business: "BRIK",
            Tags: ["feature"],
          },
        },
        {
          id: "BRIK-OPP-0002",
          frontmatter: {
            Type: "Card",
            Lane: "Planned",
            Priority: "P2",
            Owner: "Pete",
            ID: "BRIK-OPP-0002",
            Business: "BRIK",
            Tags: ["bug"],
          },
        },
        {
          id: "PLAT-OPP-0001",
          frontmatter: {
            Type: "Card",
            Lane: "In progress",
            Priority: "P0",
            Owner: "Alice",
            ID: "PLAT-OPP-0001",
            Business: "PLAT",
            Tags: ["infrastructure"],
          },
        },
      ];

      for (const card of cards) {
        const content = `---
${Object.entries(card.frontmatter)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: [${value.join(", ")}]`;
    }
    return `${key}: ${value}`;
  })
  .join("\n")}
---

Card content.
`;
        await fs.writeFile(
          path.join(businessOsPath, `cards/${card.id}.user.md`),
          content
        );
      }
    });

    it("returns all cards when no filter", async () => {
      const cards = await reader.queryCards();
      expect(cards).toHaveLength(3);
    });

    it("filters by business", async () => {
      const cards = await reader.queryCards({ business: "BRIK" });
      expect(cards).toHaveLength(2);
      expect(cards.every((c) => c.Business === "BRIK")).toBe(true);
    });

    it("filters by lane", async () => {
      const cards = await reader.queryCards({ lane: "In progress" });
      expect(cards).toHaveLength(2);
      expect(cards.every((c) => c.Lane === "In progress")).toBe(true);
    });

    it("filters by priority", async () => {
      const cards = await reader.queryCards({ priority: "P1" });
      expect(cards).toHaveLength(1);
      expect(cards[0].ID).toBe("BRIK-OPP-0001");
    });

    it("filters by owner", async () => {
      const cards = await reader.queryCards({ owner: "Alice" });
      expect(cards).toHaveLength(1);
      expect(cards[0].ID).toBe("PLAT-OPP-0001");
    });

    it("filters by tags", async () => {
      const cards = await reader.queryCards({ tags: ["feature"] });
      expect(cards).toHaveLength(1);
      expect(cards[0].ID).toBe("BRIK-OPP-0001");
    });

    it("excludes archived cards by default", async () => {
      const archivedContent = `---
Type: Card
Lane: Done
Priority: P3
Owner: Pete
ID: BRIK-OPP-0099
---

Archived.
`;
      await fs.writeFile(
        path.join(businessOsPath, "cards/archive/BRIK-OPP-0099.user.md"),
        archivedContent
      );

      const cards = await reader.queryCards();
      expect(cards).toHaveLength(3);
      expect(cards.find((c) => c.ID === "BRIK-OPP-0099")).toBeUndefined();
    });

    it("includes archived cards when requested", async () => {
      const archivedContent = `---
Type: Card
Lane: Done
Priority: P3
Owner: Pete
ID: BRIK-OPP-0099
---

Archived.
`;
      await fs.writeFile(
        path.join(businessOsPath, "cards/archive/BRIK-OPP-0099.user.md"),
        archivedContent
      );

      const cards = await reader.queryCards({ includeArchived: true });
      expect(cards).toHaveLength(4);
      expect(cards.find((c) => c.ID === "BRIK-OPP-0099")).toBeDefined();
    });
  });

  describe("getStageDoc", () => {
    beforeEach(async () => {
      await fs.mkdir(path.join(businessOsPath, "cards/BRIK-OPP-0001"), {
        recursive: true,
      });

      const stageContent = `---
Type: Stage
Stage: fact-find
Card-ID: BRIK-OPP-0001
---

# Fact Finding

Evidence gathered...
`;
      await fs.writeFile(
        path.join(businessOsPath, "cards/BRIK-OPP-0001/fact-find.user.md"),
        stageContent
      );
    });

    it("reads and parses stage document", async () => {
      const stageDoc = await reader.getStageDoc("BRIK-OPP-0001", "fact-find");

      expect(stageDoc).not.toBeNull();
      expect(stageDoc?.Stage).toBe("fact-find");
      expect(stageDoc?.["Card-ID"]).toBe("BRIK-OPP-0001");
      expect(stageDoc?.content).toContain("# Fact Finding");
    });

    it("returns null for non-existent stage doc", async () => {
      const stageDoc = await reader.getStageDoc("BRIK-OPP-0001", "plan");
      expect(stageDoc).toBeNull();
    });
  });

  describe("getCardStageDocs", () => {
    beforeEach(async () => {
      await fs.mkdir(path.join(businessOsPath, "cards/BRIK-OPP-0001"), {
        recursive: true,
      });

      // Create fact-find and plan stages
      await fs.writeFile(
        path.join(businessOsPath, "cards/BRIK-OPP-0001/fact-find.user.md"),
        `---
Type: Stage
Stage: fact-find
Card-ID: BRIK-OPP-0001
---

Fact finding content.
`
      );

      await fs.writeFile(
        path.join(businessOsPath, "cards/BRIK-OPP-0001/plan.user.md"),
        `---
Type: Stage
Stage: plan
Card-ID: BRIK-OPP-0001
---

Plan content.
`
      );
    });

    it("returns all stage docs for a card", async () => {
      const stageDocs = await reader.getCardStageDocs("BRIK-OPP-0001");

      expect(stageDocs.factFind).toBeDefined();
      expect(stageDocs.plan).toBeDefined();
      expect(stageDocs.build).toBeUndefined();
      expect(stageDocs.reflect).toBeUndefined();
    });
  });

  describe("getIdea", () => {
    beforeEach(async () => {
      const ideaContent = `---
Type: Idea
ID: BRIK-OPP-0005
Business: BRIK
Status: raw
Tags: [feature-request]
---

# Idea Title

Idea description here.
`;
      await fs.writeFile(
        path.join(businessOsPath, "ideas/inbox/BRIK-OPP-0005.user.md"),
        ideaContent
      );
    });

    it("reads and parses an idea", async () => {
      const idea = await reader.getIdea("BRIK-OPP-0005");

      expect(idea).not.toBeNull();
      expect(idea?.ID).toBe("BRIK-OPP-0005");
      expect(idea?.Business).toBe("BRIK");
      expect(idea?.Status).toBe("raw");
      expect(idea?.Tags).toEqual(["feature-request"]);
      expect(idea?.content).toContain("# Idea Title");
    });

    it("returns null for non-existent idea", async () => {
      const idea = await reader.getIdea("INVALID-0001");
      expect(idea).toBeNull();
    });

    it("searches both inbox and worked directories", async () => {
      const workedContent = `---
Type: Idea
ID: BRIK-OPP-0006
Status: worked
---

Worked idea.
`;
      await fs.writeFile(
        path.join(businessOsPath, "ideas/worked/BRIK-OPP-0006.user.md"),
        workedContent
      );

      const idea = await reader.getIdea("BRIK-OPP-0006");
      expect(idea).not.toBeNull();
      expect(idea?.Status).toBe("worked");
    });

    it("searches archives when not found in main directories", async () => {
      const archivedContent = `---
Type: Idea
ID: BRIK-OPP-0007
Status: dropped
---

Archived idea.
`;
      await fs.writeFile(
        path.join(businessOsPath, "ideas/inbox/archive/BRIK-OPP-0007.user.md"),
        archivedContent
      );

      const idea = await reader.getIdea("BRIK-OPP-0007");
      expect(idea).not.toBeNull();
      expect(idea?.Status).toBe("dropped");
    });
  });

  describe("queryIdeas", () => {
    beforeEach(async () => {
      const ideas: Array<{ id: string; location: string; frontmatter: IdeaFrontmatter }> = [
        {
          id: "BRIK-OPP-0010",
          location: "inbox",
          frontmatter: {
            Type: "Idea",
            ID: "BRIK-OPP-0010",
            Business: "BRIK",
            Status: "raw",
          },
        },
        {
          id: "BRIK-OPP-0011",
          location: "inbox",
          frontmatter: {
            Type: "Idea",
            ID: "BRIK-OPP-0011",
            Business: "BRIK",
            Status: "raw",
          },
        },
        {
          id: "PLAT-OPP-0010",
          location: "worked",
          frontmatter: {
            Type: "Opportunity",
            ID: "PLAT-OPP-0010",
            Business: "PLAT",
            Status: "worked",
          },
        },
      ];

      for (const idea of ideas) {
        const content = `---
${Object.entries(idea.frontmatter)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}
---

Idea content.
`;
        await fs.writeFile(
          path.join(businessOsPath, `ideas/${idea.location}/${idea.id}.user.md`),
          content
        );
      }
    });

    it("returns all ideas when no filter", async () => {
      const ideas = await reader.queryIdeas();
      expect(ideas).toHaveLength(3);
    });

    it("filters by business", async () => {
      const ideas = await reader.queryIdeas({ business: "BRIK" });
      expect(ideas).toHaveLength(2);
      expect(ideas.every((i) => i.Business === "BRIK")).toBe(true);
    });

    it("filters by status", async () => {
      const ideas = await reader.queryIdeas({ status: "worked" });
      expect(ideas).toHaveLength(1);
      expect(ideas[0].ID).toBe("PLAT-OPP-0010");
    });

    it("filters by location - inbox only", async () => {
      const ideas = await reader.queryIdeas({ location: "inbox" });
      expect(ideas).toHaveLength(2);
      expect(ideas.every((i) => i.ID?.startsWith("BRIK"))).toBe(true);
    });

    it("filters by location - worked only", async () => {
      const ideas = await reader.queryIdeas({ location: "worked" });
      expect(ideas).toHaveLength(1);
      expect(ideas[0].ID).toBe("PLAT-OPP-0010");
    });
  });

  describe("cardExists", () => {
    beforeEach(async () => {
      await fs.writeFile(
        path.join(businessOsPath, "cards/BRIK-OPP-0001.user.md"),
        `---
Type: Card
Lane: Inbox
Priority: P3
Owner: Pete
ID: BRIK-OPP-0001
---

Card.
`
      );
    });

    it("returns true for existing card", async () => {
      const exists = await reader.cardExists("BRIK-OPP-0001");
      expect(exists).toBe(true);
    });

    it("returns false for non-existent card", async () => {
      const exists = await reader.cardExists("INVALID-0001");
      expect(exists).toBe(false);
    });
  });

  describe("ideaExists", () => {
    beforeEach(async () => {
      await fs.writeFile(
        path.join(businessOsPath, "ideas/inbox/BRIK-OPP-0001.user.md"),
        `---
Type: Idea
ID: BRIK-OPP-0001
---

Idea.
`
      );
    });

    it("returns true for existing idea", async () => {
      const exists = await reader.ideaExists("BRIK-OPP-0001");
      expect(exists).toBe(true);
    });

    it("returns false for non-existent idea", async () => {
      const exists = await reader.ideaExists("INVALID-0001");
      expect(exists).toBe(false);
    });
  });
});
