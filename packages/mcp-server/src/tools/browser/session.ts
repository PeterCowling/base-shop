import { randomUUID } from "crypto";

import type { BrowserDriver } from "./driver.js";
import type { BrowserToolErrorEnvelope } from "./errors.js";

export type BrowserSession = {
  sessionId: string;
  driver: BrowserDriver;
  currentObservationId: string | null;
};

export type BrowserSessionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: BrowserToolErrorEnvelope };

function makeError(
  code: BrowserToolErrorEnvelope["code"],
  message: string,
  details?: Record<string, unknown>
): BrowserToolErrorEnvelope {
  return {
    code,
    message,
    retryable: false,
    details,
  };
}

export class BrowserSessionStore {
  private sessions = new Map<string, BrowserSession>();

  createSession(input: { driver: BrowserDriver }): BrowserSession {
    const session: BrowserSession = {
      sessionId: `bs_${randomUUID()}`,
      driver: input.driver,
      currentObservationId: null,
    };

    this.sessions.set(session.sessionId, session);
    return session;
  }

  getSession(sessionId: string): BrowserSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  setCurrentObservationId(sessionId: string, observationId: string): BrowserSessionResult<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        ok: false,
        error: makeError("SESSION_NOT_FOUND", `Unknown sessionId: ${sessionId}`),
      };
    }

    session.currentObservationId = observationId;
    return { ok: true, value: undefined };
  }

  assertFreshObservation(input: {
    sessionId: string;
    observationId: string;
  }): BrowserSessionResult<BrowserSession> {
    const session = this.sessions.get(input.sessionId);
    if (!session) {
      return {
        ok: false,
        error: makeError("SESSION_NOT_FOUND", `Unknown sessionId: ${input.sessionId}`),
      };
    }

    if (session.currentObservationId && input.observationId !== session.currentObservationId) {
      return {
        ok: false,
        error: makeError("STALE_OBSERVATION", "Stale observationId.", {
          currentObservationId: session.currentObservationId,
          providedObservationId: input.observationId,
        }),
      };
    }

    return { ok: true, value: session };
  }

  async closeSession(sessionId: string): Promise<BrowserSessionResult<void>> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        ok: false,
        error: makeError("SESSION_NOT_FOUND", `Unknown sessionId: ${sessionId}`),
      };
    }

    this.sessions.delete(sessionId);

    await session.driver.close();

    return { ok: true, value: undefined };
  }
}

