import { parseGenerateSeoForm } from "../parseGenerateSeoForm";

describe("parseGenerateSeoForm", () => {
  it("parses valid form data", () => {
    const fd = new FormData();
    fd.set("id", "bcd");
    fd.set("locale", "en");
    fd.set("title", "My title");
    fd.set("description", "desc");

    const result = parseGenerateSeoForm(fd);
    expect(result.data).toEqual({
      id: "bcd",
      locale: "en",
      title: "My title",
      description: "desc",
    });
  });

  it("returns errors for invalid inputs", () => {
    const fd = new FormData();
    fd.set("id", "");
    fd.set("locale", "xx");
    fd.set("title", "");
    fd.set("description", "");

    const result = parseGenerateSeoForm(fd);
    expect(result.errors).toEqual({
      id: [expect.any(String)],
      locale: [expect.any(String)],
      title: [expect.any(String)],
      description: [expect.any(String)],
    });
  });
});
