import { jest } from "@jest/globals";

describe("renderTemplate content", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("replaces placeholders with params", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );
    const { registerTemplate, renderTemplate, clearTemplates } = await import("../templates");
    registerTemplate("greet", "<p>Hello {{name}}</p>");
    expect(renderTemplate("greet", { name: "Alice" })).toBe("<p>Hello Alice</p>");
    clearTemplates();
  });

  it("replaces missing placeholders with empty string", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );
    const { registerTemplate, renderTemplate, clearTemplates } = await import("../templates");
    registerTemplate("greet", "<p>Hello {{name}}</p>");
    expect(renderTemplate("greet", {})).toBe("<p>Hello </p>");
    clearTemplates();
  });

  it("escapes HTML in placeholders", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );
    const { registerTemplate, renderTemplate, clearTemplates } = await import("../templates");
    registerTemplate("greet", "<p>{{name}}</p>");
    expect(
      renderTemplate("greet", { name: "<script>alert(1)</script>" })
    ).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
    clearTemplates();
  });
});
