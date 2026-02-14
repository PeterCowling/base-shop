/** @jest-environment node */

import type { BicAffordance } from "../tools/browser/bic";
import { deriveFormsFromAffordances } from "../tools/browser/forms";
import { paginateAffordances, rankAffordances } from "../tools/browser/ranking";

function makeAffordance(partial: Partial<BicAffordance> & Pick<BicAffordance, "actionId" | "role" | "name">) {
  const affordance: BicAffordance = {
    actionId: partial.actionId,
    role: partial.role,
    name: partial.name,
    visible: partial.visible ?? true,
    disabled: partial.disabled ?? false,
    risk: partial.risk ?? "safe",
    landmark: partial.landmark ?? "main",
    href: partial.href,
    required: partial.required,
    constraints: partial.constraints,
    value: partial.value,
    valueRedacted: partial.valueRedacted,
    sensitive: partial.sensitive,
    frameId: partial.frameId,
    nearText: partial.nearText,
    fingerprint: partial.fingerprint,
  };

  return affordance;
}

describe("browser observe shaping contract (TASK-04)", () => {
  test("TC-01: ranking prioritizes modal affordances over main when a modal is open", () => {
    const input: BicAffordance[] = [
      makeAffordance({ actionId: "a_main", role: "button", name: "Continue", landmark: "main" }),
      makeAffordance({ actionId: "a_modal", role: "button", name: "Confirm", landmark: "modal" }),
    ];

    const ranked = rankAffordances({ affordances: input });
    expect(ranked[0]?.actionId).toBe("a_modal");
    expect(ranked[1]?.actionId).toBe("a_main");
  });

  test("TC-02: paging truncates affordances to maxAffordances and returns hasMore=true with nextCursor", () => {
    const ranked: BicAffordance[] = [
      makeAffordance({ actionId: "a_1", role: "button", name: "One" }),
      makeAffordance({ actionId: "a_2", role: "button", name: "Two" }),
      makeAffordance({ actionId: "a_3", role: "button", name: "Three" }),
    ];

    const page1 = paginateAffordances({ affordances: ranked, maxAffordances: 2 });
    expect(page1.items.map((a) => a.actionId)).toEqual(["a_1", "a_2"]);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).toEqual(expect.any(String));

    const page2 = paginateAffordances({
      affordances: ranked,
      maxAffordances: 2,
      cursor: page1.nextCursor,
    });
    expect(page2.items.map((a) => a.actionId)).toEqual(["a_3"]);
    expect(page2.hasMore).toBe(false);
    expect(page2.nextCursor).toBeUndefined();
  });

  test("TC-03: derived forms reference actionId only and keep required/constraint metadata on affordances", () => {
    const affordances: BicAffordance[] = [
      makeAffordance({
        actionId: "a_email",
        role: "textbox",
        name: "Email",
        required: true,
        constraints: { type: "email" },
      }),
      makeAffordance({ actionId: "a_submit", role: "button", name: "Submit" }),
    ];

    const forms = deriveFormsFromAffordances({ affordances });
    expect(forms.length).toBe(1);
    expect(forms[0]?.fields).toEqual([{ actionId: "a_email" }]);

    const field = forms[0]?.fields[0] as Record<string, unknown>;
    expect(Object.keys(field)).toEqual(["actionId"]);

    const email = affordances.find((a) => a.actionId === "a_email");
    expect(email?.required).toBe(true);
    expect(email?.constraints?.type).toBe("email");
  });
});

