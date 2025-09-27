import { jest } from "@jest/globals";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
  });

  it("inserts empty string for missing variables", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );
    const { registerTemplate, renderTemplate, clearTemplates } = await import(
      "../templates"
    );
    registerTemplate("greet", "<p>{{name}}</p>");
    expect(renderTemplate("greet", {})).toBe("<p></p>");
    clearTemplates();
  });
});

