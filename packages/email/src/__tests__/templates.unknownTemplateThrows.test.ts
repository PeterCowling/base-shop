import { jest } from "@jest/globals";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
  });

  it("throws for unknown templates", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );

    const { renderTemplate } = await import("../templates");
    expect(() => renderTemplate("nonexistent", {})).toThrow(
      "Unknown template: nonexistent"
    );
  });
});

