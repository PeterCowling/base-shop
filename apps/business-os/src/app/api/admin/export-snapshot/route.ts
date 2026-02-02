import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  listCardsForBoard,
  listInboxIdeas,
  listWorkedIdeas,
  type StageDoc,
  StageDocSchema,
} from "@acme/platform-core/repositories/businessOs.server";

import { getDb } from "@/lib/d1.server";
import { serializeCard, serializeIdea, serializeStageDoc } from "@/lib/export/serializer";

export const runtime = "edge";

const EXPORT_API_HEADER = "x-export-api-key";

const ERROR_UNAUTHORIZED = "Unauthorized"; // i18n-exempt -- BOS-05 [ttl=2026-03-31]
const ERROR_SERVER_CONFIG = "SERVER_MISCONFIGURED"; // i18n-exempt -- BOS-05 [ttl=2026-03-31]
const MESSAGE_MISSING_KEY =
  "Missing X-Export-API-Key header"; // i18n-exempt -- BOS-05 [ttl=2026-03-31]
const MESSAGE_INVALID_KEY =
  "Invalid API key"; // i18n-exempt -- BOS-05 [ttl=2026-03-31]
const MESSAGE_MISSING_ENV =
  "BOS_EXPORT_API_KEY is not configured"; // i18n-exempt -- BOS-05 [ttl=2026-03-31]
const LOG_MISSING_KEY = "Export auth failed: missing API key"; // i18n-exempt -- BOS-05 [ttl=2026-03-31]
const LOG_INVALID_KEY = "Export auth failed: invalid API key"; // i18n-exempt -- BOS-05 [ttl=2026-03-31]
const LOG_MISSING_ENV =
  "Export auth misconfigured: missing BOS_EXPORT_API_KEY"; // i18n-exempt -- BOS-05 [ttl=2026-03-31]

type StageDocRow = {
  payload_json: string;
};

async function requireExportAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  const providedKey = request.headers.get(EXPORT_API_HEADER);
  if (!providedKey) {
    console.warn(LOG_MISSING_KEY);
    return NextResponse.json(
      { error: ERROR_UNAUTHORIZED, message: MESSAGE_MISSING_KEY },
      { status: 401 }
    );
  }

  const expectedKey = process.env.BOS_EXPORT_API_KEY;
  if (!expectedKey) {
    console.error(LOG_MISSING_ENV);
    return NextResponse.json(
      { error: ERROR_SERVER_CONFIG, message: MESSAGE_MISSING_ENV },
      { status: 500 }
    );
  }

  const matches = await timingSafeCompare(providedKey, expectedKey);
  if (!matches) {
    console.warn(LOG_INVALID_KEY);
    return NextResponse.json(
      { error: ERROR_UNAUTHORIZED, message: MESSAGE_INVALID_KEY },
      { status: 401 }
    );
  }

  return null;
}

async function timingSafeCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const expectedBytes = encoder.encode(b);
  const providedBytes = encoder.encode(a);
  const aligned = new Uint8Array(expectedBytes.length);
  aligned.set(providedBytes.subarray(0, expectedBytes.length));

  const matches = await timingSafeEqualBytes(aligned, expectedBytes);
  if (providedBytes.length !== expectedBytes.length) {
    return false;
  }
  return matches;
}

async function timingSafeEqualBytes(
  a: Uint8Array,
  b: Uint8Array
): Promise<boolean> {
  const subtle = globalThis.crypto?.subtle as
    | (SubtleCrypto & {
        timingSafeEqual?: (
          first: ArrayBufferView,
          second: ArrayBufferView
        ) => boolean | Promise<boolean>;
      })
    | undefined;

  if (subtle?.timingSafeEqual) {
    const result = subtle.timingSafeEqual(a, b);
    return typeof result === "boolean" ? result : await result;
  }

  return constantTimeEqual(a, b);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const maxLength = Math.max(a.length, b.length);
  let diff = 0;

  for (let index = 0; index < maxLength; index += 1) {
    diff |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }

  return diff === 0 && a.length === b.length;
}

async function listStageDocs(db: ReturnType<typeof getDb>): Promise<StageDoc[]> {
  const result = await db
    .prepare(
      // i18n-exempt -- BOS-05 SQL query [ttl=2026-03-31]
      "SELECT payload_json FROM business_os_stage_docs ORDER BY card_id ASC, stage ASC, created_at ASC"
    )
    .all<StageDocRow>();

  return (result.results ?? []).map((row) =>
    StageDocSchema.parse(JSON.parse(row.payload_json))
  );
}

async function getAuditCursor(db: ReturnType<typeof getDb>): Promise<number> {
  const result = await db
    .prepare(
      // i18n-exempt -- BOS-05 SQL query [ttl=2026-03-31]
      "SELECT MAX(id) as max_id FROM business_os_audit_log"
    )
    .first<{ max_id: number | null }>();

  return result?.max_id ?? 0;
}

function deriveAgentPath(userPath: string, cardId: string): string {
  if (userPath.endsWith(".user.md")) {
    return userPath.replace(/\.user\.md$/, ".agent.md");
  }
  return `docs/business-os/cards/${cardId}.agent.md`;
}

export async function GET(request: NextRequest) {
  const auth = await requireExportAuth(request);
  if (auth) return auth;

  try {
    const db = getDb();
    const [cards, inboxIdeas, workedIdeas, stageDocs, auditCursor] =
      await Promise.all([
        listCardsForBoard(db, {}),
        listInboxIdeas(db, {}),
        listWorkedIdeas(db, {}),
        listStageDocs(db),
        getAuditCursor(db),
      ]);

    const ideas = [...inboxIdeas, ...workedIdeas];

    const exportPayload = {
      exportId: globalThis.crypto?.randomUUID?.() ?? "export-unknown",
      timestamp: new Date().toISOString(),
      auditCursor,
      cards: cards.map((card) => {
        const { userMd, agentMd } = serializeCard(card);
        const path = card.filePath ?? `docs/business-os/cards/${card.ID}.user.md`;
        return {
          id: card.ID,
          path,
          content: userMd,
          agentPath: deriveAgentPath(path, card.ID),
          agentContent: agentMd,
        };
      }),
      ideas: ideas.map((idea) => {
        const content = serializeIdea(idea);
        const path =
          idea.filePath ?? `docs/business-os/ideas/inbox/${idea.ID ?? "UNKNOWN"}.user.md`;
        return {
          id: idea.ID ?? "UNKNOWN",
          path,
          content,
        };
      }),
      stageDocs: stageDocs.map((stageDoc) => {
        const content = serializeStageDoc(stageDoc);
        const cardId = stageDoc["Card-ID"];
        const stage = stageDoc.Stage;
        const path = `docs/business-os/cards/${cardId}/${stage}.user.md`;
        return {
          cardId,
          stage,
          path,
          content,
        };
      }),
    };

    return NextResponse.json(exportPayload);
  } catch (error) {
    return NextResponse.json(
      {
        // i18n-exempt -- BOS-05 API error message [ttl=2026-03-31]
        error: "Failed to export snapshot",
        // i18n-exempt -- BOS-05 API error message [ttl=2026-03-31]
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
