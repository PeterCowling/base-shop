import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import ExportPage from "../src/app/cms/shop/[shop]/pages/[page]/export/page";

const MOCK_TRANSLATION = "Mock export heading";

jest.mock("@acme/i18n", () => ({
  useTranslations: () => () => MOCK_TRANSLATION,
}));

describe("Export page route", () => {
  it("renders the translated heading", () => {
    render(<ExportPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: MOCK_TRANSLATION })
    ).toBeInTheDocument();
  });
});
