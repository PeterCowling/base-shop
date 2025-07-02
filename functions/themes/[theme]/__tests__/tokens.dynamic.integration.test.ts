import { onRequest } from "../tokens.dynamic.css.ts";

test("sets caching headers", async () => {
  const next = jest.fn(async () => new Response(""));
  const req = new Request("https://example.com");
  const res = await onRequest({ request: req, next } as any);
  expect(next).toHaveBeenCalled();
  expect(res.headers.get("Cache-Control")).toBe(
    "public, max-age=31536000, immutable"
  );
});
