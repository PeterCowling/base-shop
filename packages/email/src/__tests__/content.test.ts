describe("content helpers", () => {
  it("deriveText strips tags and decodes entities", async () => {
    const { deriveText } = await import("../content");
    const html = '<p>Hello&nbsp;<strong>world</strong>&amp;lt;</p><script>1</script>';
    expect(deriveText(html)).toBe("Hello world<");
  });

  it("ensureText derives text when missing", async () => {
    const { ensureText } = await import("../content");
    const opts = ensureText({ to: "a", subject: "b", html: "<p>Hi</p>" });
    expect(opts.text).toBe("Hi");
  });

  it("prepareContent sanitizes html and derives text", async () => {
    const { prepareContent } = await import("../content");
    const opts = await prepareContent({
      to: "a",
      subject: "b",
      html: "<p>Hello</p><script>alert(1)</script>",
    });
    expect(opts.html).toBe("<p>Hello</p>");
    expect(opts.text).toBe("Hello");
  });
});

