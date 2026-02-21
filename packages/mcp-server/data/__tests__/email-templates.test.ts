/**
 * TASK-03: Add cancellation email template
 *
 * TC-01: Template entry exists with subject, body, category → template added
 * TC-02: Import templates file in test → import succeeds
 * TC-03: Grep shows template is present → grep finds it
 */

import templates from "../email-templates.json";

describe("Email Templates - Cancellation Confirmation", () => {
  // TC-01: Template entry exists with subject, body, category → template added
  test("should include cancellation confirmation template", () => {
    const cancellationTemplate = templates.find(
      (t) => t.subject === "Cancellation Confirmation"
    );

    expect(cancellationTemplate).toBeDefined();
    expect(cancellationTemplate?.body).toContain("cancelled");
    expect(cancellationTemplate?.category).toBe("cancellation");
  });

  // TC-02: Import templates file in test → import succeeds
  test("should successfully import templates from JSON file", () => {
    expect(templates).toBeDefined();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
  });

  // TC-03: All templates have required fields
  test("all templates should have subject, body, and category", () => {
    templates.forEach((template, index) => {
      expect(template).toHaveProperty("subject");
      expect(template).toHaveProperty("body");
      expect(template).toHaveProperty("category");
      expect(typeof template.subject).toBe("string");
      expect(typeof template.body).toBe("string");
      expect(typeof template.category).toBe("string");
    });
  });
});
