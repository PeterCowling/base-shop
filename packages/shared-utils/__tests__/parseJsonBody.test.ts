import { parseJsonBody } from "../src/parseJsonBody";
import { z } from "zod";

function makeRequest(body: unknown) {
  return new Request("http://test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("parseJsonBody", () => {
  it("returns data when valid", async () => {
    const schema = z.object({ x: z.string() }).strict();
    const result = await parseJsonBody(makeRequest({ x: "hi" }), schema, "1mb");
    expect(result).toEqual({ success: true, data: { x: "hi" } });
  });

  it("returns response when invalid", async () => {
    const schema = z.object({ x: z.string() }).strict();
    const result = await parseJsonBody(makeRequest({}), schema, "1mb");
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
  });

  it("returns error when JSON is malformed", async () => {
    const schema = z.object({ x: z.string() }).strict();
    const req = new Request("http://test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid}",
    });
    const result = await parseJsonBody(req, schema, "1mb");
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    expect(await result.response.json()).toEqual({ error: "Invalid JSON" });
  });

  it("returns 413 when body exceeds limit", async () => {
    const schema = z.object({ x: z.string() }).strict();
    const result = await parseJsonBody(makeRequest({ x: "hi" }), schema, "5b");
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(413);
  });
});
