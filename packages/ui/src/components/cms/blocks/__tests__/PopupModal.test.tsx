import { render } from "@testing-library/react";
import PopupModal from "../PopupModal";

describe("PopupModal", () => {
  it("strips malicious HTML", () => {
    const malicious = '<img src="x" onerror="alert(1)"><script>alert("xss")</script>';
    const { container } = render(<PopupModal content={malicious} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("onerror")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });
});
