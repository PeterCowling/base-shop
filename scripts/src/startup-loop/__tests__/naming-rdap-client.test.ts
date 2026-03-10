import { describe, expect, it } from "@jest/globals";

import {
  formatRdapLegacyLine,
  formatRdapLegacyText,
  rdapBatchCheck,
} from "../naming/rdap-client.js";
import { rdapCheckWithRetry } from "../naming/rdap-retry.js";
import type { RdapBatchResult, RdapResult } from "../naming/rdap-types.js";

/**
 * RDAP client tests — naming-rdap-client
 *
 * TC-01: Known-taken domain → classified taken
 * TC-02: Known-available domain → classified available
 * TC-03: Simulated throttling → retries + explicit terminal state
 * TC-04: Compatibility run → legacy RDAP text artifact format
 * TC-05: Unknown state (connection error)
 */

// Instant sleep stub — avoids real delays in tests
const noSleep = (_ms: number): Promise<void> => Promise.resolve();

describe("rdapCheckWithRetry", () => {
  // TC-01: 200 → taken
  describe("TC-01: known-taken domain", () => {
    it("classifies a 200 response as taken", async () => {
      const mockFetch = async (_url: string): Promise<Response> => {
        return { status: 200 } as Response;
      };

      const result = await rdapCheckWithRetry("tenura", {
        fetchFn: mockFetch,
        sleepFn: noSleep,
      });

      expect(result.status).toBe("taken");
      expect(result.statusCode).toBe(200);
      expect(result.retries).toBe(0);
      expect(result.unknownReason).toBeNull();
      expect(result.name).toBe("tenura");
      expect(result.terminalClassification).toBe("taken");
    });
  });

  // TC-02: 404 → available
  describe("TC-02: known-available domain", () => {
    it("classifies a 404 response as available", async () => {
      const mockFetch = async (_url: string): Promise<Response> => {
        return { status: 404 } as Response;
      };

      const result = await rdapCheckWithRetry("sfogella", {
        fetchFn: mockFetch,
        sleepFn: noSleep,
      });

      expect(result.status).toBe("available");
      expect(result.statusCode).toBe(404);
      expect(result.retries).toBe(0);
      expect(result.unknownReason).toBeNull();
      expect(result.name).toBe("sfogella");
      expect(result.terminalClassification).toBe("available");
    });
  });

  // TC-03: 429 throttle → retries then resolves available
  describe("TC-03: simulated throttling", () => {
    it("retries on 429 and resolves to available after throttle clears", async () => {
      let callCount = 0;

      const mockFetch = async (_url: string): Promise<Response> => {
        callCount++;
        if (callCount <= 2) {
          return { status: 429 } as Response;
        }
        return { status: 404 } as Response;
      };

      const result = await rdapCheckWithRetry("sfogella", {
        fetchFn: mockFetch,
        sleepFn: noSleep,
        baseDelayMs: 0,
        maxDelayMs: 0,
      });

      expect(result.status).toBe("available");
      expect(result.statusCode).toBe(404);
      expect(result.retries).toBe(2);
      expect(result.unknownReason).toBeNull();
      expect(result.terminalClassification).toBe("available");
    });
  });

  // TC-05: Network error → unknown with connection_error reason
  describe("TC-05: connection error", () => {
    it("returns unknown with connection_error after exhausting retries on TypeError", async () => {
      const maxRetries = 3;

      const mockFetch = async (_url: string): Promise<Response> => {
        throw new TypeError("fetch failed");
      };

      const result = await rdapCheckWithRetry("collocata", {
        fetchFn: mockFetch,
        sleepFn: noSleep,
        maxRetries,
        baseDelayMs: 0,
        maxDelayMs: 0,
      });

      expect(result.status).toBe("unknown");
      expect(result.unknownReason).toBe("connection_error");
      expect(result.retries).toBe(maxRetries);
      expect(result.statusCode).toBeNull();
      expect(result.terminalClassification).toBe("unknown");
    });
  });
});

// TC-04: Legacy text artifact format
describe("TC-04: legacy RDAP text artifact format", () => {
  it("produces correctly spaced legacy artifact lines", () => {
    const availableResult: RdapResult = {
      name: "Sfogella",
      status: "available",
      statusCode: 404,
      unknownReason: null,
      retries: 0,
      latencyMs: 42,
      terminalClassification: "available",
    };

    const takenResult: RdapResult = {
      name: "Tenura",
      status: "taken",
      statusCode: 200,
      unknownReason: null,
      retries: 0,
      latencyMs: 38,
      terminalClassification: "taken",
    };

    const batchResult: RdapBatchResult = {
      results: [availableResult, takenResult],
      checkedAt: "2026-02-26T10:00:00.000Z",
      totalMs: 80,
    };

    const text = formatRdapLegacyText(batchResult);

    // Exact format match: status padded to 10 chars + space + name
    // "AVAILABLE " (10) + "Sfogella" → "AVAILABLE  Sfogella" (two spaces: 9 + pad 1 + sep 1)
    // "TAKEN     " (10) + "Tenura"   → "TAKEN      Tenura" (six spaces: 5 + pad 5 + sep 1)
    expect(text).toBe("AVAILABLE  Sfogella\nTAKEN      Tenura\n");
  });

  it("formats individual AVAILABLE line with correct spacing", () => {
    const result: RdapResult = {
      name: "Sfogella",
      status: "available",
      statusCode: 404,
      unknownReason: null,
      retries: 0,
      latencyMs: 42,
      terminalClassification: "available",
    };
    expect(formatRdapLegacyLine(result)).toBe("AVAILABLE  Sfogella");
  });

  it("formats individual TAKEN line with correct spacing", () => {
    const result: RdapResult = {
      name: "Tenura",
      status: "taken",
      statusCode: 200,
      unknownReason: null,
      retries: 0,
      latencyMs: 38,
      terminalClassification: "taken",
    };
    expect(formatRdapLegacyLine(result)).toBe("TAKEN      Tenura");
  });

  it("formats UNKNOWN(000) connection error line with correct spacing", () => {
    const result: RdapResult = {
      name: "Collocata",
      status: "unknown",
      statusCode: null,
      unknownReason: "connection_error",
      retries: 3,
      latencyMs: 9000,
      terminalClassification: "unknown",
    };
    expect(formatRdapLegacyLine(result)).toBe("UNKNOWN(000) Collocata");
  });
});

describe("rdapBatchCheck", () => {
  it("processes multiple names sequentially with injected fetch", async () => {
    const mockFetch = async (url: string): Promise<Response> => {
      if (url.includes("sfogella")) return { status: 404 } as Response;
      if (url.includes("tenura")) return { status: 200 } as Response;
      return { status: 404 } as Response;
    };

    const batchResult = await rdapBatchCheck(["sfogella", "tenura"], {
      fetchFn: mockFetch,
      sleepFn: noSleep,
    });

    expect(batchResult.results).toHaveLength(2);
    expect(batchResult.results[0].status).toBe("available");
    expect(batchResult.results[0].name).toBe("sfogella");
    expect(batchResult.results[1].status).toBe("taken");
    expect(batchResult.results[1].name).toBe("tenura");
    expect(batchResult.checkedAt).toBeTruthy();
    expect(typeof batchResult.totalMs).toBe("number");
  });
});
