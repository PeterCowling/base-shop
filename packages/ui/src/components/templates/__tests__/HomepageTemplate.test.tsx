import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { HomepageTemplate } from "../HomepageTemplate";

describe("HomepageTemplate", () => {
  it("renders hero, content, and recommendations", () => {
    render(
      <HomepageTemplate
        hero={<div>Hero Section</div>}
        recommendations={<div>Recommendations</div>}
      >
        <p>Main Content</p>
      </HomepageTemplate>
    );

    expect(screen.getByText("Hero Section")).toBeInTheDocument();
    expect(screen.getByText("Main Content")).toBeInTheDocument();
    expect(screen.getByText("Recommendations")).toBeInTheDocument();
  });
});
