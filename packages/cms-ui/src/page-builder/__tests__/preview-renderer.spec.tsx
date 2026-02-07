import { render, screen } from "@testing-library/react";

import type { ScaffoldSpec } from "@acme/types/page/ScaffoldSpec";

import PreviewRenderer from "../PreviewRenderer";

describe("PreviewRenderer", () => {
  it("renders hero, sections and cta", () => {
    const spec: ScaffoldSpec = {
      layout: "default",
      sections: ["Intro"],
      hero: "Welcome",
      cta: "Start",
    };
    render(<PreviewRenderer spec={spec} />);
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Intro")).toBeInTheDocument();
    expect(screen.getByText("Start")).toBeInTheDocument();
  });
});
