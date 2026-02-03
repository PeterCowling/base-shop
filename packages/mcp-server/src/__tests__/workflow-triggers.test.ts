/** @jest-environment node */

import {
  buildPrepaymentActivityLog,
  getPrepaymentActivity,
  resolvePrepaymentWorkflow,
  selectPrepaymentTemplate,
} from "../utils/workflow-triggers";

describe("workflow triggers", () => {
  it("selects correct prepayment templates by step and provider", () => {
    expect(
      selectPrepaymentTemplate({ step: "first", provider: "octorate" }).subject
    ).toBe("Prepayment - 1st Attempt Failed (Octorate)");

    expect(
      selectPrepaymentTemplate({ step: "first", provider: "hostelworld" }).subject
    ).toBe("Prepayment - 1st Attempt Failed (Hostelworld)");

    expect(selectPrepaymentTemplate({ step: "second" }).subject).toBe(
      "Prepayment - 2nd Attempt Failed"
    );

    expect(selectPrepaymentTemplate({ step: "third" }).subject).toBe(
      "Prepayment - Cancelled post 3rd Attempt"
    );

    expect(selectPrepaymentTemplate({ step: "success" }).subject).toBe(
      "Prepayment Successful"
    );
  });

  it("maps prepayment steps to activity codes", () => {
    expect(getPrepaymentActivity("first").code).toBe(2);
    expect(getPrepaymentActivity("second").code).toBe(3);
    expect(getPrepaymentActivity("third").code).toBe(4);
    expect(getPrepaymentActivity("success").code).toBe(21);
  });

  it("builds activity log payloads with expected metadata", () => {
    const payload = buildPrepaymentActivityLog({
      bookingRef: "BOOK123",
      step: "second",
      actor: "mcp",
    });

    expect(payload).toEqual({
      bookingRef: "BOOK123",
      code: 3,
      description: "Second reminder to agree to terms",
      actor: "mcp",
    });
  });

  it("resolves full prepayment workflow details", () => {
    const resolved = resolvePrepaymentWorkflow({
      step: "first",
      provider: "hostelworld",
    });

    expect(resolved.activity.code).toBe(2);
    expect(resolved.template.subject).toBe(
      "Prepayment - 1st Attempt Failed (Hostelworld)"
    );
  });
});
