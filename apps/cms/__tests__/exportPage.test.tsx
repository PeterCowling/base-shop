import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";

const translate = jest.fn();

jest.mock("@acme/i18n", () => ({
  useTranslations: () => translate,
}));

import ExportPage from "../src/app/cms/shop/[shop]/pages/[page]/export/page";

describe("ExportPage", () => {
  const headingText = "Mocked export heading";

  beforeEach(() => {
    translate.mockReset();
  });

  it("renders heading from translations", () => {
    translate.mockReturnValue(headingText);

    render(<ExportPage />);

    expect(translate).toHaveBeenCalledWith("cms.export.title");
    expect(screen.getByRole("heading", { name: headingText })).toBeInTheDocument();
  });
});
