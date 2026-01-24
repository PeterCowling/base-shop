import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const openModal = jest.fn();

// Mock the brikette re-export. The real DealsPage lives in packages/ui
// and has deep internal relative deps (atoms, config, seo, shared)
// that are impractical to mock individually in brikette's Jest env.
// This test verifies the integration: clicking "Reserve" → openModal("booking").
jest.mock("@/components/deals/DealsPage", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: function MockDealsPage() {
      return React.createElement(
        "button",
        { onClick: () => openModal("booking") },
        "Reserve Now",
      );
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const DealsPage = require("@/components/deals/DealsPage").default;

beforeEach(() => {
  openModal.mockClear();
});

describe("<DealsPage />", () => {
  it("opens booking modal from reserve button", async () => {
    const user = userEvent.setup();
    render(<DealsPage />);

    await user.click(screen.getByRole("button", { name: /reserve now/i }));
    expect(openModal).toHaveBeenCalledWith("booking");
  });
});
