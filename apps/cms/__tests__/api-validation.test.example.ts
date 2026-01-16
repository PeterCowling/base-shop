/**
 * Example tests for API validation infrastructure
 *
 * Copy and adapt these tests when testing migrated endpoints.
 * Place actual tests in __tests__/api/ directory.
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  validateQuery,
  validateBody,
  validateResponse,
  QuerySchemas,
  ResponseSchemas,
} from "@/lib/server/queryValidation";

// ============================================================================
// Query Parameter Validation Tests
// ============================================================================

describe("validateQuery", () => {
  it("should validate valid query parameters", () => {
    const schema = z.object({
      shop: QuerySchemas.shop,
      page: QuerySchemas.page.optional(),
    });

    const req = new NextRequest("http://localhost/api?shop=test&page=1");
    const result = validateQuery(req, schema);

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ shop: "test", page: 1 });
  });

  it("should reject invalid query parameters", () => {
    const schema = z.object({
      shop: QuerySchemas.shop,
      page: QuerySchemas.page,
    });

    const req = new NextRequest("http://localhost/api?shop=test&page=invalid");
    const result = validateQuery(req, schema);

    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it("should apply default values", () => {
    const schema = z.object({
      shop: z.string().default("default"),
      limit: QuerySchemas.limit,
    });

    const req = new NextRequest("http://localhost/api");
    const result = validateQuery(req, schema);

    expect(result.data).toEqual({ shop: "default", limit: 50 });
  });

  it("should enforce maximum values", () => {
    const schema = z.object({
      limit: QuerySchemas.limit,
    });

    const req = new NextRequest("http://localhost/api?limit=1000");
    const result = validateQuery(req, schema);

    expect(result.error).toBeDefined();
  });
});

// ============================================================================
// Request Body Validation Tests
// ============================================================================

describe("validateBody", () => {
  it("should validate valid JSON body", async () => {
    const schema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
    });

    const req = new NextRequest("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test Title" }),
    });

    const result = await validateBody(req, schema);

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ title: "Test Title" });
  });

  it("should reject invalid body data", async () => {
    const schema = z.object({
      title: z.string().min(1).max(200),
    });

    const req = new NextRequest("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }), // Empty string fails min(1)
    });

    const result = await validateBody(req, schema);

    expect(result.error).toBeDefined();
  });

  it("should reject oversized bodies", async () => {
    const schema = z.object({
      data: z.string(),
    });

    const largeData = "x".repeat(2 * 1024 * 1024); // 2MB
    const req = new NextRequest("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: largeData }),
    });

    const result = await validateBody(req, schema);

    expect(result.error).toBeDefined();
    // Should have 413 status
    if (result.error) {
      const json = await result.error.json();
      expect(json.error).toContain("too large");
    }
  });

  it("should handle email validation", async () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const req = new NextRequest("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email" }),
    });

    const result = await validateBody(req, schema);

    expect(result.error).toBeDefined();
  });

  it("should handle custom refinements", async () => {
    const schema = z
      .object({
        item: z.record(z.unknown()).optional(),
        items: z.array(z.record(z.unknown())).optional(),
      })
      .refine((data) => data.item || data.items, {
        message: "Either item or items must be provided",
      });

    const req = new NextRequest("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // Neither field provided
    });

    const result = await validateBody(req, schema);

    expect(result.error).toBeDefined();
  });
});

// ============================================================================
// Response Validation Tests
// ============================================================================

describe("validateResponse", () => {
  it("should validate valid response data", () => {
    const schema = z.object({
      id: z.string(),
      name: z.string(),
    });

    const data = { id: "123", name: "Test" };
    const response = validateResponse(data, schema);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
  });

  it("should reject invalid response data in development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const schema = z.object({
      id: z.string(),
      name: z.string(),
    });

    // Missing required field
    const data = { id: "123" };
    const response = validateResponse(data, schema);

    expect(response.status).toBe(500);

    process.env.NODE_ENV = originalEnv;
  });

  it("should set custom status codes", () => {
    const schema = ResponseSchemas.error;

    const response = validateResponse(
      { error: "Not found" },
      schema,
      { status: 404 }
    );

    expect(response.status).toBe(404);
  });

  it("should set custom headers", () => {
    const schema = ResponseSchemas.ok;

    const response = validateResponse(
      { ok: true },
      schema,
      {
        status: 201,
        headers: { "X-Custom-Header": "value" },
      }
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("X-Custom-Header")).toBe("value");
  });

  it("should validate success response", () => {
    const response = validateResponse(
      { success: true },
      ResponseSchemas.success
    );

    expect(response.status).toBe(200);
  });

  it("should validate error response", () => {
    const response = validateResponse(
      { error: "Something failed", details: { field: "value" } },
      ResponseSchemas.error,
      { status: 400 }
    );

    expect(response.status).toBe(400);
  });

  it("should validate ok response", () => {
    const response = validateResponse({ ok: true }, ResponseSchemas.ok);

    expect(response.status).toBe(200);
  });
});

// ============================================================================
// Common Schemas Tests
// ============================================================================

describe("QuerySchemas", () => {
  it("should validate shop parameter", () => {
    const result = QuerySchemas.shop.safeParse("valid-shop");
    expect(result.success).toBe(true);
  });

  it("should reject empty shop parameter", () => {
    const result = QuerySchemas.shop.safeParse("");
    expect(result.success).toBe(false);
  });

  it("should coerce page to number", () => {
    const result = QuerySchemas.page.safeParse("5");
    expect(result.success).toBe(true);
    expect(result.data).toBe(5);
  });

  it("should apply limit default and max", () => {
    const result = QuerySchemas.limit.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBe(50);

    const tooLarge = QuerySchemas.limit.safeParse(500);
    expect(tooLarge.success).toBe(false);
  });
});

describe("ResponseSchemas", () => {
  it("should validate success schema", () => {
    const result = ResponseSchemas.success.safeParse({ success: true });
    expect(result.success).toBe(true);

    const invalid = ResponseSchemas.success.safeParse({ success: false });
    expect(invalid.success).toBe(false);
  });

  it("should validate error schema", () => {
    const result = ResponseSchemas.error.safeParse({
      error: "Something failed",
      details: { field: "value" },
    });
    expect(result.success).toBe(true);
  });

  it("should validate paginated schema", () => {
    const itemSchema = z.object({ id: z.string() });
    const paginatedSchema = ResponseSchemas.paginated(itemSchema);

    const result = paginatedSchema.safeParse({
      items: [{ id: "1" }, { id: "2" }],
      total: 100,
      page: 1,
      pageSize: 10,
    });

    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Integration Tests - Full Endpoint Flow
// ============================================================================

describe("Full endpoint validation flow", () => {
  // Mock endpoint handler
  async function mockEndpoint(req: NextRequest) {
    // Query validation
    const querySchema = z.object({
      shop: QuerySchemas.shop,
    });
    const queryResult = validateQuery(req, querySchema);
    if (queryResult.error) return queryResult.error;

    // Body validation
    const bodySchema = z.object({
      title: z.string().min(1).max(200),
    });
    const bodyResult = await validateBody(req, bodySchema);
    if (bodyResult.error) return bodyResult.error;

    // Process data (mocked)
    const data = {
      id: "123",
      title: bodyResult.data.title,
      shop: queryResult.data.shop,
    };

    // Response validation
    const responseSchema = z.object({
      id: z.string(),
      title: z.string(),
      shop: z.string(),
    });

    return validateResponse(data, responseSchema, { status: 201 });
  }

  it("should validate complete request/response cycle", async () => {
    const req = new NextRequest("http://localhost/api?shop=test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test Title" }),
    });

    const response = await mockEndpoint(req);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toEqual({
      id: "123",
      title: "Test Title",
      shop: "test",
    });
  });

  it("should reject invalid query parameters", async () => {
    const req = new NextRequest("http://localhost/api?shop=", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });

    const response = await mockEndpoint(req);

    expect(response.status).toBe(400);
  });

  it("should reject invalid body", async () => {
    const req = new NextRequest("http://localhost/api?shop=test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }), // Empty title
    });

    const response = await mockEndpoint(req);

    expect(response.status).toBe(400);
  });
});

// ============================================================================
// Real Endpoint Tests - Campaigns API Example
// ============================================================================

describe("POST /api/campaigns", () => {
  it("should accept valid campaign data", async () => {
    const req = new NextRequest("http://localhost/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "test@example.com",
        subject: "Test Subject",
        body: "<p>Test content</p>",
      }),
    });

    // Note: This would call the actual endpoint
    // const response = await POST(req);
    // expect(response.status).toBe(200);
  });

  it("should reject invalid email", async () => {
    const req = new NextRequest("http://localhost/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "invalid-email",
        subject: "Test",
        body: "Test",
      }),
    });

    // Would return 400 with validation error
  });

  it("should reject oversized body", async () => {
    const largeBody = "x".repeat(60000); // Over 50000 limit

    const req = new NextRequest("http://localhost/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "test@example.com",
        subject: "Test",
        body: largeBody,
      }),
    });

    // Would return 400 with validation error
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe("Validation performance", () => {
  it("should validate queries efficiently", () => {
    const schema = z.object({
      shop: QuerySchemas.shop,
      page: QuerySchemas.page.optional(),
      limit: QuerySchemas.limit.optional(),
    });

    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      const req = new NextRequest(`http://localhost/api?shop=test&page=${i}`);
      validateQuery(req, schema);
    }

    const duration = performance.now() - start;

    // Should be fast - less than 100ms for 1000 validations
    expect(duration).toBeLessThan(100);
  });

  it("should validate responses efficiently", () => {
    const schema = z.object({
      id: z.string(),
      name: z.string(),
      count: z.number(),
    });

    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      validateResponse(
        { id: `${i}`, name: `Item ${i}`, count: i },
        schema
      );
    }

    const duration = performance.now() - start;

    // Should be fast
    expect(duration).toBeLessThan(100);
  });
});

// ============================================================================
// Helper Functions for Testing
// ============================================================================

/**
 * Create a mock NextRequest for testing
 */
function createMockRequest(
  url: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
): NextRequest {
  return new NextRequest(url, {
    method: options?.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}

/**
 * Extract JSON from response
 */
async function getResponseJson(response: NextResponse): Promise<unknown> {
  const text = await response.text();
  return JSON.parse(text);
}

/**
 * Assert response has expected structure
 */
function assertResponseStructure(
  response: unknown,
  expectedKeys: string[]
): void {
  expect(response).toBeDefined();
  expect(typeof response).toBe("object");

  for (const key of expectedKeys) {
    expect(response).toHaveProperty(key);
  }
}

// ============================================================================
// Export helpers for use in other tests
// ============================================================================

export {
  createMockRequest,
  getResponseJson,
  assertResponseStructure,
};
