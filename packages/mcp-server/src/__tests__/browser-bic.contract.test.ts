/** @jest-environment node */

import { type BicObservation, bicSchema } from "../tools/browser/bic";
import { redactAffordanceValue } from "../tools/browser/redaction";
import { classifyAffordanceRisk } from "../tools/browser/risk";

describe("browser BIC v0.1 contract", () => {
  test("TC-01: BIC example object conforms to runtime schema", () => {
    const example: BicObservation = {
      schemaVersion: "0.1",
      observationId: "obs_000123",
      createdAt: "2026-02-14T19:22:00.000Z",
      page: {
        domain: "example.com",
        url: "https://example.com/checkout",
        finalUrl: "https://example.com/checkout",
        lang: "en",
        title: "Checkout",
        primaryHeading: "Checkout",
        routeKey: "checkout|Shipping|nav:Checkout",
        loadState: "interactive",
        blockingOverlay: { present: false },
        blockers: [{ type: "cookieConsent", present: true }],
        banners: [{ severity: "warning", text: "Cookies required" }],
        modals: [],
        frames: [{ frameId: "main", frameUrl: "https://example.com/checkout" }],
      },
      nextCursor: "cur_0001",
      hasMore: false,
      affordances: [
        {
          actionId: "a_17",
          role: "button",
          name: "Place order",
          visible: true,
          disabled: false,
          risk: "danger",
          landmark: "main",
          nearText: "Total EUR 42.00",
          frameId: "main",
          fingerprint: { kind: "roleNameNearText", value: "button|Place order|Total" },
        },
        {
          actionId: "a_08",
          role: "textbox",
          name: "Email",
          visible: true,
          disabled: false,
          risk: "safe",
          landmark: "main",
          required: true,
          constraints: { type: "email" },
          valueRedacted: true,
          sensitive: false,
          frameId: "main",
        },
      ],
      forms: [
        {
          section: "Shipping",
          fields: [{ actionId: "a_08" }],
        },
      ],
    };

    const parsed = bicSchema.safeParse(example);
    expect(parsed.success).toBe(true);
  });

  test("TC-02: Sensitive affordance omits value and sets valueRedacted=true", () => {
    const redacted = redactAffordanceValue({
      actionId: "a_01",
      role: "textbox",
      name: "Card number",
      visible: true,
      disabled: false,
      risk: "safe",
      landmark: "main",
      value: "4242 4242 4242 4242",
      sensitive: true,
    });

    expect(redacted.value).toBeUndefined();
    expect(redacted.valueRedacted).toBe(true);
  });

  test('TC-03: Risk classifier marks "Place order" as danger', () => {
    const risk = classifyAffordanceRisk({
      role: "button",
      name: "Place order",
      nearText: "Total EUR 42.00",
    });

    expect(risk).toBe("danger");
  });
});
