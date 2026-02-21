import { randomUUID } from "crypto";

import type { BrowserDriver } from "./driver.js";
import type { BrowserToolErrorEnvelope } from "./errors.js";

export type BrowserSession = {
  sessionId: string;
  driver: BrowserDriver;
  currentObservationId: string | null;
  currentActionTargets: Map<string, BrowserActionTarget>;
};

export type BrowserSessionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: BrowserToolErrorEnvelope };

export type BrowserActionTarget = {
  selector: string;
  bestEffort: boolean;
  frameId?: string;
};

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
      currentActionTargets: new Map(),
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
    session.currentActionTargets.clear();
    return { ok: true, value: undefined };
  }

  setCurrentObservation(input: {
    sessionId: string;
    observationId: string;
    actionTargets: Readonly<Record<string, BrowserActionTarget>>;
  }): BrowserSessionResult<void> {
    const session = this.sessions.get(input.sessionId);
    if (!session) {
      return {
        ok: false,
        error: makeError("SESSION_NOT_FOUND", `Unknown sessionId: ${input.sessionId}`),
      };
    }

    session.currentObservationId = input.observationId;
    session.currentActionTargets = new Map(Object.entries(input.actionTargets));

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

  resolveActionTarget(input: {
    sessionId: string;
    observationId: string;
    actionId: string;
  }): BrowserSessionResult<BrowserActionTarget> {
    const fresh = this.assertFreshObservation({
      sessionId: input.sessionId,
      observationId: input.observationId,
    });
    if (!fresh.ok) {
      return fresh;
    }

    const target = fresh.value.currentActionTargets.get(input.actionId);
    if (!target) {
      return {
        ok: false,
        error: makeError("ACTION_NOT_FOUND", `Unknown actionId for this observation: ${input.actionId}`),
      };
    }

    return { ok: true, value: target };
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
