/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "../route";

describe("POST /api/preview", () => {
  it("sets component versions cookie when provided", async () => {
    const req = new NextRequest("http://localhost/api/preview", {
      method: "POST",
      body: JSON.stringify({ versions: { a: "1" } }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.cookies.get("component-versions")?.value).toBe(
      JSON.stringify({ a: "1" }),
    );
  });

  it("does not set cookie when versions missing", async () => {
    const req = new NextRequest("http://localhost/api/preview", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.cookies.get("component-versions")).toBeUndefined();
  });
});
