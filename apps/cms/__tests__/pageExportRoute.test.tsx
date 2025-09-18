import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const MOCK_TRANSLATION = "Mock export heading";

jest.mock("@acme/i18n", () => ({
  useTranslations: () => () => MOCK_TRANSLATION,
}));

import ExportPage from "../src/app/cms/shop/[shop]/pages/[page]/export/page";

describe("Export page route", () => {
  it("renders the translated heading", () => {
    render(<ExportPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: MOCK_TRANSLATION })
    ).toBeInTheDocument();
  });
});
