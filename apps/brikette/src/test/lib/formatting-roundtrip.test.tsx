import { render } from "@testing-library/react";

import {
  renderBodyBlocks,
  renderGuideLinkTokens,
  sanitizeLinkLabel,
  stripGuideMarkup,
} from "@/routes/guides/utils/linkTokens";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

describe("Formatting Round-Trip", () => {
  describe("Inline formatting", () => {
    it("renders **bold** as <strong>", () => {
      const result = renderGuideLinkTokens("**bold**", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("strong")).toHaveTextContent("bold");
    });

    it("renders *italic* as <em>", () => {
      const result = renderGuideLinkTokens("*italic*", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("em")).toHaveTextContent("italic");
    });

    it("renders ***bold+italic*** as <strong><em>", () => {
      const result = renderGuideLinkTokens("***both***", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("strong")).toBeTruthy();
      expect(container.querySelector("strong em")).toHaveTextContent("both");
    });

    it("supports nested italics inside bold", () => {
      const result = renderGuideLinkTokens("**bold *nested* more**", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("strong")).toHaveTextContent("bold nested more");
      expect(container.querySelector("strong em")).toHaveTextContent("nested");
    });

    it("treats unclosed bold markers as literal text", () => {
      const result = renderGuideLinkTokens("**bold but no close", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("strong")).toBeNull();
      expect(container.textContent).toBe("**bold but no close");
    });

    it("renders %LINK:key|label% as <a>", () => {
      const result = renderGuideLinkTokens("%LINK:pathOfTheGods|trail%", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("a")).toHaveTextContent("trail");
    });

    it("treats escaped asterisks as literal", () => {
      const result = renderGuideLinkTokens("a\\*b\\*c", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("em")).toBeNull();
      expect(container.textContent).toBe("a*b*c");
    });

    it("unescapes ordered-list escapes at line start", () => {
      const result = renderGuideLinkTokens("1\\. Step one", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe("1. Step one");
    });
  });

  describe("Block-level rendering (lists)", () => {
    it("renders list block as <ul><li>", () => {
      const blocks = ["* First\n* Second\n* Third"];
      const { container } = render(<>{renderBodyBlocks(blocks, "en", "test")}</>);

      const ul = container.querySelector("ul");
      expect(ul).not.toBeNull();

      const lis = container.querySelectorAll("li");
      expect(lis).toHaveLength(3);
      expect(lis[0]).toHaveTextContent("First");
    });

    it("groups consecutive bullet lines into a single <ul>", () => {
      const blocks = ["Directions:", "* Step one", "* Step two"];
      const { container } = render(<>{renderBodyBlocks(blocks, "en", "test")}</>);
      expect(container.querySelectorAll("ul")).toHaveLength(1);
      expect(container.querySelectorAll("li")).toHaveLength(2);
    });
  });

  describe("Delimiter safety", () => {
    it("sanitizes % in link labels", () => {
      const sanitized = sanitizeLinkLabel("50% Off Deal");
      expect(sanitized).toBe("50 Off Deal");
    });

    it("handles | in link labels", () => {
      const sanitized = sanitizeLinkLabel("Option A | Option B");
      expect(sanitized).toBe("Option A - Option B");
    });
  });

  describe("SEO sanitization", () => {
    it("strips link tokens and markdown markers for JSON-LD/SEO strings", () => {
      const stripped = stripGuideMarkup("See %LINK:pathOfTheGods|trail% and **bold**.");
      expect(stripped).toBe("See trail and bold.");
    });
  });
});
