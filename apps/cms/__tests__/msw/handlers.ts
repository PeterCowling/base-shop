import { rest } from "msw";

/** Collected bodies from configurator requests for assertions */
export const configuratorRequests: unknown[] = [];

export const handlers = [
  rest.post("/cms/api/configurator", async (req, res, ctx) => {
    const body = await req.json();
    configuratorRequests.push(body);
    return res(
      ctx.status(201),
      ctx.json({ id: "testshop", message: "shop created successfully" })
    );
  }),

  rest.get("/cms/api/wizard-progress", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ state: {}, completed: {} }))
  ),
  rest.put("/cms/api/wizard-progress", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({}))
  ),
  rest.patch("/cms/api/wizard-progress", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({}))
  ),

  rest.get("/cms/api/theme/list", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(["base", "dark"]))
  ),
  rest.get("/cms/api/theme/tokens", (req, res, ctx) => {
    const theme = req.url.searchParams.get("name");
    const tokens =
      theme === "dark"
        ? { "--color-primary": "220 90% 66%" }
        : { "--color-primary": "220 90% 56%" };
    return res(ctx.status(200), ctx.json(tokens));
  }),

  rest.get("/cms/api/products/slug/:slug", (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        title: "Test",
        slug: req.params.slug,
        price: 100,
        stock: 1,
        media: [{ url: "/test.jpg" }],
      })
    )
  ),

  rest.post(
    "/cms/api/marketing/email/provider-webhooks/sendgrid",
    (_req, res, ctx) => res(ctx.status(200), ctx.json({ success: true }))
  ),
  rest.post(
    "/cms/api/marketing/email/provider-webhooks/resend",
    (_req, res, ctx) => res(ctx.status(200), ctx.json({ success: true }))
  ),
];

export { rest };
