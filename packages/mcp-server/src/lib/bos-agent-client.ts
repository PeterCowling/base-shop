import { z } from "zod";

import type { ToolErrorCode } from "../tools/policy.js";

const cardsResponseSchema = z.object({
  cards: z.array(z.record(z.unknown())),
});

const stageDocResponseSchema = z.object({
  entity: z.record(z.unknown()),
  entitySha: z.string().min(1),
});

export type BosAgentClientErrorCode = Extract<
  ToolErrorCode,
  | "AUTH_FAILED"
  | "NOT_FOUND"
  | "UPSTREAM_UNAVAILABLE"
  | "INTERNAL_ERROR"
  | "CONTRACT_MISMATCH"
  | "CONFLICT_ENTITY_SHA"
>;

export class BosAgentClientError extends Error {
  constructor(
    message: string,
    readonly code: BosAgentClientErrorCode,
    readonly retryable: boolean,
    readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "BosAgentClientError";
  }
}

export interface BosCardsQuery {
  business: string;
  lane?: string;
}

export interface BosStageDocQuery {
  cardId: string;
  stage: string;
}

export interface BosStageDocPatchQuery {
  cardId: string;
  stage: string;
  baseEntitySha: string;
  patch: Record<string, unknown>;
}

interface BosAgentClientConfig {
  baseUrl: string;
  apiKey: string;
}

function resolveConfig(): BosAgentClientConfig {
  const baseUrl = process.env.BOS_AGENT_API_BASE_URL?.trim();
  const apiKey = process.env.BOS_AGENT_API_KEY?.trim();

  if (!baseUrl) {
    throw new BosAgentClientError(
      "BOS_AGENT_API_BASE_URL is required for BOS bridge tools.",
      "CONTRACT_MISMATCH",
      false
    );
  }

  if (!apiKey) {
    throw new BosAgentClientError(
      "BOS_AGENT_API_KEY is required for BOS bridge tools.",
      "CONTRACT_MISMATCH",
      false
    );
  }

  return { baseUrl, apiKey };
}

function mapStatusToError(
  status: number,
  statusText: string,
  path: string
): BosAgentClientError {
  if (status === 401 || status === 403) {
    return new BosAgentClientError(
      `BOS auth failed for ${path}: ${status} ${statusText}`,
      "AUTH_FAILED",
      false,
      { status }
    );
  }

  if (status === 404) {
    return new BosAgentClientError(
      `BOS resource not found for ${path}.`,
      "NOT_FOUND",
      false,
      { status }
    );
  }

  if (status >= 500) {
    return new BosAgentClientError(
      `BOS upstream unavailable for ${path}: ${status} ${statusText}`,
      "UPSTREAM_UNAVAILABLE",
      true,
      { status }
    );
  }

  return new BosAgentClientError(
    `BOS request failed for ${path}: ${status} ${statusText}`,
    "INTERNAL_ERROR",
    false,
    { status }
  );
}

async function requestJson(path: string): Promise<unknown> {
  const config = resolveConfig();
  const url = new URL(path, config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-Agent-API-Key": config.apiKey,
      },
    });

    if (!response.ok) {
      throw mapStatusToError(response.status, response.statusText, path);
    }

    return response.json();
  } catch (error) {
    if (error instanceof BosAgentClientError) {
      throw error;
    }

    throw new BosAgentClientError(
      `BOS request failed for ${path}: ${String(error)}`,
      "UPSTREAM_UNAVAILABLE",
      true
    );
  }
}

async function requestJsonWithBody(
  path: string,
  method: "PATCH",
  body: Record<string, unknown>
): Promise<unknown> {
  const config = resolveConfig();
  const url = new URL(path, config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        "X-Agent-API-Key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.status === 409) {
      let conflictBody: Record<string, unknown> | null = null;
      try {
        conflictBody = (await response.json()) as Record<string, unknown>;
      } catch {
        conflictBody = null;
      }

      throw new BosAgentClientError(
        `BOS entity conflict for ${path}; re-read required.`,
        "CONFLICT_ENTITY_SHA",
        false,
        {
          status: 409,
          currentEntitySha:
            typeof conflictBody?.currentEntitySha === "string"
              ? conflictBody.currentEntitySha
              : undefined,
          re_read_required: true,
        }
      );
    }

    if (!response.ok) {
      throw mapStatusToError(response.status, response.statusText, path);
    }

    return response.json();
  } catch (error) {
    if (error instanceof BosAgentClientError) {
      throw error;
    }

    throw new BosAgentClientError(
      `BOS request failed for ${path}: ${String(error)}`,
      "UPSTREAM_UNAVAILABLE",
      true
    );
  }
}

export async function listBosCards(query: BosCardsQuery): Promise<Array<Record<string, unknown>>> {
  const path = new URL("/api/agent/cards", "http://localhost");
  path.searchParams.set("business", query.business);
  if (query.lane) {
    path.searchParams.set("lane", query.lane);
  }

  const payload = await requestJson(path.pathname + path.search);
  return cardsResponseSchema.parse(payload).cards;
}

export async function getBosStageDoc(
  query: BosStageDocQuery
): Promise<{ entity: Record<string, unknown>; entitySha: string }> {
  const encodedCardId = encodeURIComponent(query.cardId);
  const encodedStage = encodeURIComponent(query.stage);
  const payload = await requestJson(`/api/agent/stage-docs/${encodedCardId}/${encodedStage}`);
  const parsed = stageDocResponseSchema.parse(payload);

  return {
    entity: parsed.entity,
    entitySha: parsed.entitySha,
  };
}

export async function patchBosStageDoc(
  query: BosStageDocPatchQuery
): Promise<{ entity: Record<string, unknown>; entitySha: string }> {
  const encodedCardId = encodeURIComponent(query.cardId);
  const encodedStage = encodeURIComponent(query.stage);
  const payload = await requestJsonWithBody(
    `/api/agent/stage-docs/${encodedCardId}/${encodedStage}`,
    "PATCH",
    {
      baseEntitySha: query.baseEntitySha,
      patch: query.patch,
    }
  );

  const parsed = stageDocResponseSchema.parse(payload);
  return {
    entity: parsed.entity,
    entitySha: parsed.entitySha,
  };
}
