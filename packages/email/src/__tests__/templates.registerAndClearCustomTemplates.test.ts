import { jest } from "@jest/globals";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
  });

  it("registers and clears custom templates", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );
    const { registerTemplate, renderTemplate, clearTemplates } = await import(
      "../templates"
    );
    registerTemplate("welcome", "<p>Hi</p>");
    expect(renderTemplate("welcome", {})).toBe("<p>Hi</p>");
    clearTemplates();
    expect(() => renderTemplate("welcome", {})).toThrow(
      "Unknown template: welcome"
    );
  });
});

