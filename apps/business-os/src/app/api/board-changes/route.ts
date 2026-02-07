import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  type Card,
  getCardById,
  getIdeaById,
  getLatestStageDoc,
  type Idea,
  listCardsForBoard,
  listInboxIdeas,
  listWorkedIdeas,
  type StageDoc,
  StageDocSchema,
  StageTypeSchema,
} from "@acme/platform-core/repositories/businessOs.server";

import { getDb } from "@/lib/d1.server";

type AuditDeltaRow = {
  id: number;
  entity_type: "card" | "idea" | "stage_doc";
  entity_id: string;
};

type StageDocRow = {
  payload_json: string;
};

type BoardChanges = {
  cursor: number;
  changes: {
    cards: Card[];
    ideas: Idea[];
    stage_docs: StageDoc[];
  };
};

function parseCursor(cursorParam: string | null): number | null {
  if (!cursorParam) return 0;
  const parsed = Number.parseInt(cursorParam, 10);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
}

function isCursorStale(cursor: number, minId: number | null): boolean {
  if (cursor === 0 || !minId) return false;
  return cursor < minId - 1;
}

async function getAuditBounds(
  db: ReturnType<typeof getDb>
): Promise<{ minId: number | null; maxId: number | null }> {
  const maxResult = await db
    .prepare(
      // i18n-exempt -- BOS-04 SQL query [ttl=2026-03-31]
      "SELECT MAX(id) as max_id FROM business_os_audit_log"
    )
    .first<{ max_id: number | null }>();

  const minResult = await db
    .prepare(
      // i18n-exempt -- BOS-04 SQL query [ttl=2026-03-31]
      "SELECT MIN(id) as min_id FROM business_os_audit_log"
    )
    .first<{ min_id: number | null }>();

  return {
    minId: minResult?.min_id ?? null,
    maxId: maxResult?.max_id ?? null,
  };
}

async function listAuditEntriesSince(
  db: ReturnType<typeof getDb>,
  cursor: number
): Promise<AuditDeltaRow[]> {
  const result = await db
    .prepare(
      // i18n-exempt -- BOS-04 SQL query [ttl=2026-03-31]
      "SELECT id, entity_type, entity_id FROM business_os_audit_log WHERE id > ? ORDER BY id ASC"
    )
    .bind(cursor)
    .all<AuditDeltaRow>();

  return (result.results ?? []) as AuditDeltaRow[];
}

async function listStageDocsForBoard(
  db: ReturnType<typeof getDb>,
  business?: string
): Promise<StageDoc[]> {
  const query = business
    ? // i18n-exempt -- BOS-04 SQL query [ttl=2026-03-31]
      "SELECT sd.payload_json FROM business_os_stage_docs sd JOIN business_os_cards c ON sd.card_id = c.id WHERE c.business = ? ORDER BY sd.stage ASC, sd.created_at ASC"
    : // i18n-exempt -- BOS-04 SQL query [ttl=2026-03-31]
      "SELECT payload_json FROM business_os_stage_docs ORDER BY stage ASC, created_at ASC";

  const prepared = business ? db.prepare(query).bind(business) : db.prepare(query);
  const result = await prepared.all<StageDocRow>();

  return (result.results ?? []).map((row) =>
    StageDocSchema.parse(JSON.parse(row.payload_json))
  );
}

function parseStageDocKey(entityId: string): { cardId: string; stage: string } | null {
  const [cardId, stage] = entityId.split(":");
  if (!cardId || !stage) return null;
  return { cardId, stage };
}

function collectEntityIds(auditEntries: AuditDeltaRow[]) {
  const cardIds = new Set<string>();
  const ideaIds = new Set<string>();
  const stageDocKeys = new Set<string>();

  for (const entry of auditEntries) {
    if (entry.entity_type === "card") cardIds.add(entry.entity_id);
    if (entry.entity_type === "idea") ideaIds.add(entry.entity_id);
    if (entry.entity_type === "stage_doc") stageDocKeys.add(entry.entity_id);
  }

  return { cardIds, ideaIds, stageDocKeys };
}

async function loadCards(
  db: ReturnType<typeof getDb>,
  cardIds: Set<string>,
  business: string | undefined,
  cardCache: Map<string, Card | null>
): Promise<Card[]> {
  const cards: Card[] = [];
  for (const cardId of cardIds) {
    const card = await getCardById(db, cardId);
    cardCache.set(cardId, card ?? null);
    if (!card) continue;
    if (business && card.Business !== business) continue;
    cards.push(card);
  }
  return cards;
}

async function loadIdeas(
  db: ReturnType<typeof getDb>,
  ideaIds: Set<string>,
  business: string | undefined
): Promise<Idea[]> {
  const ideas: Idea[] = [];
  for (const ideaId of ideaIds) {
    const idea = await getIdeaById(db, ideaId);
    if (!idea) continue;
    if (business && idea.Business !== business) continue;
    ideas.push(idea);
  }
  return ideas;
}

async function loadStageDocs(
  db: ReturnType<typeof getDb>,
  stageDocKeys: Set<string>,
  business: string | undefined,
  cardCache: Map<string, Card | null>
): Promise<StageDoc[]> {
  const stageDocs: StageDoc[] = [];

  for (const key of stageDocKeys) {
    const parsed = parseStageDocKey(key);
    if (!parsed) continue;

    const stageResult = StageTypeSchema.safeParse(parsed.stage);
    if (!stageResult.success) continue;

    if (business) {
      const cachedCard = cardCache.get(parsed.cardId);
      const card = cachedCard ?? (await getCardById(db, parsed.cardId));
      cardCache.set(parsed.cardId, card ?? null);
      if (!card || card.Business !== business) continue;
    }

    const stageDoc = await getLatestStageDoc(db, parsed.cardId, stageResult.data);
    if (stageDoc) stageDocs.push(stageDoc);
  }

  return stageDocs;
}

async function buildFullSnapshot(
  db: ReturnType<typeof getDb>,
  business: string | undefined,
  latestCursor: number
): Promise<BoardChanges> {
  const [cards, inboxIdeas, workedIdeas, stageDocs] = await Promise.all([
    listCardsForBoard(db, business ? { business } : {}),
    listInboxIdeas(db, business ? { business } : {}),
    listWorkedIdeas(db, business ? { business } : {}),
    listStageDocsForBoard(db, business),
  ]);

  return {
    cursor: latestCursor,
    changes: {
      cards,
      ideas: [...inboxIdeas, ...workedIdeas],
      stage_docs: stageDocs,
    },
  };
}

async function buildDeltaSnapshot(
  db: ReturnType<typeof getDb>,
  cursor: number,
  latestCursor: number,
  business: string | undefined
): Promise<BoardChanges> {
  const auditEntries = await listAuditEntriesSince(db, cursor);
  const { cardIds, ideaIds, stageDocKeys } = collectEntityIds(auditEntries);

  const cardCache = new Map<string, Card | null>();
  const cards = await loadCards(db, cardIds, business, cardCache);
  const ideas = await loadIdeas(db, ideaIds, business);
  const stageDocs = await loadStageDocs(db, stageDocKeys, business, cardCache);

  return {
    cursor: latestCursor,
    changes: {
      cards,
      ideas,
      stage_docs: stageDocs,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursorParam = searchParams.get("cursor");
    const business = searchParams.get("business") ?? undefined;

    const cursor = parseCursor(cursorParam);
    if (cursor === null) {
      return NextResponse.json(
        // i18n-exempt -- BOS-04 API validation message [ttl=2026-03-31]
        { error: "Invalid cursor" },
        { status: 400 }
      );
    }

    const db = getDb();
    const { minId, maxId } = await getAuditBounds(db);
    const latestCursor = maxId ?? 0;

    if (isCursorStale(cursor, minId)) {
      return NextResponse.json(
        {
          // i18n-exempt -- BOS-04 API stale cursor message [ttl=2026-03-31]
          error: "CURSOR_STALE",
          // i18n-exempt -- BOS-04 API stale cursor message [ttl=2026-03-31]
          message: "Cursor is stale; perform full refresh",
          cursor: latestCursor,
        },
        { status: 410 }
      );
    }

    const payload =
      cursor === 0
        ? await buildFullSnapshot(db, business, latestCursor)
        : await buildDeltaSnapshot(db, cursor, latestCursor, business);

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        // i18n-exempt -- BOS-04 API error message [ttl=2026-03-31]
        error: "Failed to fetch board changes",
        // i18n-exempt -- BOS-04 API error message [ttl=2026-03-31]
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
