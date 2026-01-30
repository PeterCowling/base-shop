import path from "node:path";

import matter from "gray-matter";

import { computeFileSha } from "./file-sha";
import { readdirWithinRoot, readFileWithinRoot } from "./safe-fs";
import type {
  Business,
  BusinessCatalog,
  Card,
  CardFrontmatter,
  CardQuery,
  Idea,
  IdeaFrontmatter,
  IdeaQuery,
  StageDoc,
  StageFrontmatter,
  StageType,
} from "./types";

/**
 * Business OS repository reader
 *
 * Reads and parses markdown documents with frontmatter from docs/business-os/
 */

export class RepoReader {
  constructor(private repoRoot: string) {}

  /**
   * Get the Business OS root directory
   */
  private get businessOsPath(): string {
    return path.join(this.repoRoot, "docs/business-os");
  }

  /**
   * Read and parse business catalog
   */
  async getBusinessCatalog(): Promise<BusinessCatalog> {
    const catalogPath = path.join(
      this.businessOsPath,
      "strategy/businesses.json"
    );
    const content = (await readFileWithinRoot(
      this.repoRoot,
      catalogPath,
      "utf-8"
    )) as string;
    return JSON.parse(content) as BusinessCatalog;
  }

  /**
   * Get a single business by ID
   */
  async getBusiness(businessId: string): Promise<Business | null> {
    const catalog = await this.getBusinessCatalog();
    return catalog.businesses.find((b) => b.id === businessId) ?? null;
  }

  /**
   * Get all businesses
   */
  async getBusinesses(): Promise<Business[]> {
    const catalog = await this.getBusinessCatalog();
    return catalog.businesses;
  }

  /**
   * Read and parse a card by ID
   */
  async getCard(cardId: string): Promise<Card | null> {
    const userPath = path.join(
      this.businessOsPath,
      `cards/${cardId}.user.md`
    );

    try {
      const content = (await readFileWithinRoot(
        this.repoRoot,
        userPath,
        "utf-8"
      )) as string;
      const fileSha = computeFileSha(content);
      const parsed = matter(content);

      return {
        ...(parsed.data as CardFrontmatter),
        content: parsed.content,
        filePath: userPath,
        fileSha,
      };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        // Try archive
        const archivePath = path.join(
          this.businessOsPath,
          `cards/archive/${cardId}.user.md`
        );
        try {
          const content = (await readFileWithinRoot(
            this.repoRoot,
            archivePath,
            "utf-8"
          )) as string;
          const fileSha = computeFileSha(content);
          const parsed = matter(content);

          return {
            ...(parsed.data as CardFrontmatter),
            content: parsed.content,
            filePath: archivePath,
            fileSha,
          };
        } catch {
          return null;
        }
      }
      throw err;
    }
  }

  /**
   * Query cards with filters
   */
  async queryCards(query: CardQuery = {}): Promise<Card[]> {
    const cards: Card[] = [];

    // Read cards from main directory
    const cardsPath = path.join(this.businessOsPath, "cards");
    cards.push(...(await this.readCardsFromDirectory(cardsPath)));

    // Include archived cards if requested
    if (query.includeArchived) {
      const archivePath = path.join(cardsPath, "archive");
      cards.push(...(await this.readCardsFromDirectory(archivePath)));
    }

    // Apply filters
    return cards.filter((card) => {
      if (query.business && card.Business !== query.business) return false;
      if (query.lane && card.Lane !== query.lane) return false;
      if (query.priority && card.Priority !== query.priority) return false;
      if (query.owner && card.Owner !== query.owner) return false;
      if (query.tags && query.tags.length > 0) {
        const cardTags = card.Tags ?? [];
        if (!query.tags.some((tag) => cardTags.includes(tag))) return false;
      }
      return true;
    });
  }

  /**
   * Read all .user.md cards from a directory
   */
  private async readCardsFromDirectory(dirPath: string): Promise<Card[]> {
    const cards: Card[] = [];

    try {
      const entries = await readdirWithinRoot(this.repoRoot, dirPath, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!entry.name.endsWith(".user.md")) continue;
        if (entry.name.startsWith(".")) continue;

        const filePath = path.join(dirPath, entry.name);
        const content = (await readFileWithinRoot(
          this.repoRoot,
          filePath,
          "utf-8"
        )) as string;
        const fileSha = computeFileSha(content);
        const parsed = matter(content);

        cards.push({
          ...(parsed.data as CardFrontmatter),
          content: parsed.content,
          filePath,
          fileSha,
        });
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(`Warning: Could not read cards from ${dirPath}:`, err);
      }
    }

    return cards;
  }

  /**
   * Get stage document for a card
   */
  async getStageDoc(
    cardId: string,
    stage: StageType
  ): Promise<StageDoc | null> {
    const userPath = path.join(
      this.businessOsPath,
      `cards/${cardId}/${stage}.user.md`
    );

    try {
      const content = (await readFileWithinRoot(
        this.repoRoot,
        userPath,
        "utf-8"
      )) as string;
      const fileSha = computeFileSha(content);
      const parsed = matter(content);

      return {
        ...(parsed.data as StageFrontmatter),
        content: parsed.content,
        filePath: userPath,
        fileSha,
      };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw err;
    }
  }

  /**
   * Get all stage docs for a card
   */
  async getCardStageDocs(cardId: string): Promise<{
    factFind?: StageDoc;
    plan?: StageDoc;
    build?: StageDoc;
    reflect?: StageDoc;
  }> {
    const [factFind, plan, build, reflect] = await Promise.all([
      this.getStageDoc(cardId, "fact-find"),
      this.getStageDoc(cardId, "plan"),
      this.getStageDoc(cardId, "build"),
      this.getStageDoc(cardId, "reflect"),
    ]);

    return {
      factFind: factFind ?? undefined,
      plan: plan ?? undefined,
      build: build ?? undefined,
      reflect: reflect ?? undefined,
    };
  }

  /**
   * Read and parse an idea by ID
   */
  async getIdea(ideaId: string, location?: "inbox" | "worked"): Promise<Idea | null> {
    // Try inbox first if location not specified or is inbox
    if (!location || location === "inbox") {
      const inboxPath = path.join(
        this.businessOsPath,
        `ideas/inbox/${ideaId}.user.md`
      );
      const idea = await this.readIdeaFile(inboxPath);
      if (idea) return idea;

      // Try inbox archive
      const inboxArchivePath = path.join(
        this.businessOsPath,
        `ideas/inbox/archive/${ideaId}.user.md`
      );
      const archivedIdea = await this.readIdeaFile(inboxArchivePath);
      if (archivedIdea) return archivedIdea;
    }

    // Try worked if location not specified or is worked
    if (!location || location === "worked") {
      const workedPath = path.join(
        this.businessOsPath,
        `ideas/worked/${ideaId}.user.md`
      );
      const idea = await this.readIdeaFile(workedPath);
      if (idea) return idea;

      // Try worked archive
      const workedArchivePath = path.join(
        this.businessOsPath,
        `ideas/worked/archive/${ideaId}.user.md`
      );
      const archivedIdea = await this.readIdeaFile(workedArchivePath);
      if (archivedIdea) return archivedIdea;
    }

    return null;
  }

  /**
   * Read an idea file
   */
  private async readIdeaFile(filePath: string): Promise<Idea | null> {
    try {
      const content = (await readFileWithinRoot(
        this.repoRoot,
        filePath,
        "utf-8"
      )) as string;
      const fileSha = computeFileSha(content);
      const parsed = matter(content);

      return {
        ...(parsed.data as IdeaFrontmatter),
        content: parsed.content,
        filePath,
        fileSha,
      };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw err;
    }
  }

  /**
   * Query ideas with filters
   */
  async queryIdeas(query: IdeaQuery = {}): Promise<Idea[]> {
    const ideas: Idea[] = [];

    // Read from inbox if no location specified or inbox requested
    if (!query.location || query.location === "inbox") {
      const inboxPath = path.join(this.businessOsPath, "ideas/inbox");
      ideas.push(...(await this.readIdeasFromDirectory(inboxPath)));

      if (query.includeArchived) {
        const inboxArchivePath = path.join(inboxPath, "archive");
        ideas.push(...(await this.readIdeasFromDirectory(inboxArchivePath)));
      }
    }

    // Read from worked if no location specified or worked requested
    if (!query.location || query.location === "worked") {
      const workedPath = path.join(this.businessOsPath, "ideas/worked");
      ideas.push(...(await this.readIdeasFromDirectory(workedPath)));

      if (query.includeArchived) {
        const workedArchivePath = path.join(workedPath, "archive");
        ideas.push(...(await this.readIdeasFromDirectory(workedArchivePath)));
      }
    }

    // Apply filters
    return ideas.filter((idea) => {
      if (query.business && idea.Business !== query.business) return false;
      if (query.status && idea.Status !== query.status) return false;
      return true;
    });
  }

  /**
   * Read all .user.md ideas from a directory
   */
  private async readIdeasFromDirectory(dirPath: string): Promise<Idea[]> {
    const ideas: Idea[] = [];

    try {
      const entries = await readdirWithinRoot(this.repoRoot, dirPath, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!entry.name.endsWith(".user.md")) continue;
        if (entry.name.startsWith(".")) continue;

        const filePath = path.join(dirPath, entry.name);
        const content = (await readFileWithinRoot(
          this.repoRoot,
          filePath,
          "utf-8"
        )) as string;
        const fileSha = computeFileSha(content);
        const parsed = matter(content);

        ideas.push({
          ...(parsed.data as IdeaFrontmatter),
          content: parsed.content,
          filePath,
          fileSha,
        });
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(`Warning: Could not read ideas from ${dirPath}:`, err);
      }
    }

    return ideas;
  }

  /**
   * Check if a card exists
   */
  async cardExists(cardId: string): Promise<boolean> {
    const card = await this.getCard(cardId);
    return card !== null;
  }

  /**
   * Check if an idea exists
   */
  async ideaExists(ideaId: string): Promise<boolean> {
    const idea = await this.getIdea(ideaId);
    return idea !== null;
  }
}

/**
 * Create a RepoReader instance
 */
export function createRepoReader(repoRoot: string): RepoReader {
  return new RepoReader(repoRoot);
}
