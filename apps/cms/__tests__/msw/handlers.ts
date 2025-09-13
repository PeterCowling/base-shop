import { rest } from "msw";
import { baseTokens } from "../../src/app/cms/wizard/tokenUtils";

export const handlers = [
  rest.get("/cms/api/configurator-progress", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ state: {}, completed: {} }))
  ),
  rest.put("/cms/api/configurator-progress", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({}))
  ),
  rest.patch("/cms/api/configurator-progress", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({}))
  ),
  rest.post("/cms/api/configurator", async (_req, res, ctx) =>
    res(
      ctx.status(201),
      ctx.json({ id: "testshop", message: "shop created successfully" })
    )
  ),
  rest.get("/cms/api/theme/list", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ themes: ["base", "dark"] }))
  ),
  rest.get("/cms/api/theme/tokens", (req, res, ctx) => {
    const name = req.url.searchParams.get("name");
    // For tests we reuse base tokens regardless of theme name
    return res(ctx.status(200), ctx.json(baseTokens));
  }),
  rest.get("/cms/api/pages/:shopId", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json([]))
  ),
  rest.get("/cms/api/products/slug/:slug", (_req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        title: "Test",
        price: 100,
        stock: 1,
        media: [{ url: "/image.png" }],
      })
    )
  ),
  rest.get("*/api/products", (_req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        title: "Test",
        price: 100,
        stock: 1,
        media: [{ url: "/image.png" }],
      })
    )
  ),
  rest.post(
    "/cms/api/marketing/email/provider-webhooks/sendgrid",
    (_req, res, ctx) => res(ctx.status(200), ctx.json({ received: true }))
  ),
  rest.post(
    "/cms/api/marketing/email/provider-webhooks/resend",
    (_req, res, ctx) => res(ctx.status(200), ctx.json({ received: true }))
  ),
];

export { rest };
