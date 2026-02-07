import { HttpResponse } from "msw";

import { baseTokens } from "../../src/app/cms/wizard/tokenUtils";

import { rest } from "~test/msw/shared";

export const handlers = [
  rest.get("/cms/api/configurator-progress", () =>
    HttpResponse.json({ state: {}, completed: {} })
  ),
  rest.put("/cms/api/configurator-progress", () =>
    HttpResponse.json({})
  ),
  rest.patch("/cms/api/configurator-progress", () =>
    HttpResponse.json({})
  ),
  rest.post("/cms/api/configurator", () =>
    HttpResponse.json(
      { id: "testshop", message: "shop created successfully" },
      { status: 201 }
    )
  ),
  rest.get("/cms/api/theme/list", () =>
    HttpResponse.json({ themes: ["base", "dark"] })
  ),
  rest.get("/cms/api/theme/tokens", ({ request }) => {
    const url = new URL(request.url);
    const _name = url.searchParams.get("name");
    // For tests we reuse base tokens regardless of theme name
    return HttpResponse.json(baseTokens);
  }),
  rest.get("/cms/api/pages/:shopId", () =>
    HttpResponse.json([])
  ),
  rest.get("/cms/api/products/slug/:slug", () =>
    HttpResponse.json({
      title: "Test",
      price: 100,
      stock: 1,
      media: [{ url: "/image.png" }],
    })
  ),
  rest.get("*/api/products", () =>
    HttpResponse.json({
      title: "Test",
      price: 100,
      stock: 1,
      media: [{ url: "/image.png" }],
    })
  ),
  rest.post(
    "/cms/api/marketing/email/provider-webhooks/sendgrid",
    () => HttpResponse.json({ received: true })
  ),
  rest.post(
    "/cms/api/marketing/email/provider-webhooks/resend",
    () => HttpResponse.json({ received: true })
  ),
];

export { rest };
