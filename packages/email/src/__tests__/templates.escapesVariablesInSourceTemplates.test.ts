import { jest } from "@jest/globals";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
  });

  it("escapes variables in source templates", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );
    const { registerTemplate, renderTemplate, clearTemplates } = await import(
      "../templates"
    );
    registerTemplate("greet", "<p>{{name}}</p>");
    expect(
      renderTemplate("greet", { name: "<script>alert(1)</script>" })
    ).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
    clearTemplates();
  });
});

