describe("validators", () => {
  it("normalizes and validates email", async () => {
    const { emailSchema } = await import("../validators");
    expect(emailSchema.parse(" Test@Example.com ")).toBe("test@example.com");
    expect(() => emailSchema.parse("bad-email")).toThrow();
  });

  it("trims and validates subject", async () => {
    const { subjectSchema } = await import("../validators");
    expect(subjectSchema.parse(" Hello ")).toBe("Hello");
    expect(() => subjectSchema.parse("")).toThrow("Email subject is required");
  });
});

