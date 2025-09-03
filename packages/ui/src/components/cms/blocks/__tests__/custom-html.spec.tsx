import { render } from "@testing-library/react";
import DOMPurify from "dompurify";
import CustomHtml from "../CustomHtml";

describe("CustomHtml", () => {
  it("renders nothing when html is undefined", () => {
    const { container } = render(<CustomHtml />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when html is empty", () => {
    const { container } = render(<CustomHtml html="" />);
    expect(container.firstChild).toBeNull();
  });

  it("sanitizes html and does not execute scripts", () => {
    (window as any).__custom_html_test__ = "safe";
    const html = `<div>Safe<script>window.__custom_html_test__='hacked'<\/script></div>`;
    const { container } = render(<CustomHtml html={html} />);
    const sanitized = DOMPurify.sanitize(html);

    expect(container.firstChild?.innerHTML).toBe(sanitized);
    expect(container.querySelector("script")).toBeNull();
    expect((window as any).__custom_html_test__).toBe("safe");
  });
});
