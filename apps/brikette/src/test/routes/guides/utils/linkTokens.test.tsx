import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import { renderBodyBlocks, renderGuideLinkTokens, stripGuideMarkup } from "@/routes/guides/utils/linkTokens";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("guide link tokens + markdown-lite", () => {
  it("renders bold/italic markup", () => {
    const nodes = renderGuideLinkTokens("Hello **bold** and *italic*.", "en", "t");
    render(<div data-cy="root">{nodes}</div>);

    expect(screen.getByTestId("root")).toHaveTextContent("Hello bold and italic.");
    expect(screen.getByTestId("root").querySelector("strong")).toHaveTextContent("bold");
    expect(screen.getByTestId("root").querySelector("em")).toHaveTextContent("italic");
  });

  it("supports nested italics inside bold", () => {
    const nodes = renderGuideLinkTokens("**bold *nested* more**", "en", "t");
    render(<div data-cy="root">{nodes}</div>);

    const strong = screen.getByTestId("root").querySelector("strong");
    const em = screen.getByTestId("root").querySelector("strong em");
    expect(strong).toHaveTextContent("bold nested more");
    expect(em).toHaveTextContent("nested");
  });

  it("treats unclosed or empty emphasis spans as literal text", () => {
    const nodes1 = renderGuideLinkTokens("**bold but no close", "en", "t");
    render(<div data-cy="root1">{nodes1}</div>);
    expect(screen.getByTestId("root1")).toHaveTextContent("**bold but no close");
    expect(screen.getByTestId("root1").querySelector("strong")).toBeNull();

    const nodes2 = renderGuideLinkTokens("****", "en", "t");
    render(<div data-cy="root2">{nodes2}</div>);
    expect(screen.getByTestId("root2")).toHaveTextContent("****");
    expect(screen.getByTestId("root2").querySelector("strong")).toBeNull();
  });

  it("unescapes escaped asterisks inside emphasis spans", () => {
    const nodes = renderGuideLinkTokens("**a\\*b\\*c**", "en", "t");
    render(<div data-cy="root">{nodes}</div>);

    expect(screen.getByTestId("root").querySelector("strong")).toHaveTextContent("a*b*c");
  });

  it("preserves legacy spacing behavior for adjacent link tokens", () => {
    const nodes = renderGuideLinkTokens("Hello%HOWTO:foo|How to get here%", "en", "t");
    render(<div data-cy="root">{nodes}</div>);
    expect(screen.getByTestId("root")).toHaveTextContent("Hello How to get here");
  });

  it("renders bullet lists from either multi-line blocks or consecutive '* ' entries", () => {
    const nodes1 = renderBodyBlocks(["* one\n* two"], "en", "t");
    render(<div data-cy="root1">{nodes1}</div>);
    expect(screen.getByTestId("root1").querySelectorAll("ul li")).toHaveLength(2);

    const nodes2 = renderBodyBlocks(["* one", "* two", "tail"], "en", "t");
    render(<div data-cy="root2">{nodes2}</div>);
    expect(screen.getByTestId("root2").querySelectorAll("ul li")).toHaveLength(2);
    expect(screen.getByTestId("root2")).toHaveTextContent("tail");
  });

  it("strips tokens, list markers, escapes, and emphasis markers for SEO text", () => {
    expect(stripGuideMarkup("See %HOWTO:foo|How to get here%")).toBe("See How to get here");
    expect(stripGuideMarkup("List:\n* one\n* two")).toBe("List:\none\ntwo");
    expect(stripGuideMarkup("Ordered: 1\\. Step")).toBe("Ordered: 1. Step");
    expect(stripGuideMarkup("Try **bold** and *italic*")).toBe("Try bold and italic");
    expect(stripGuideMarkup("Escaped literal star: \\*")).toBe("Escaped literal star: *");
  });
});
