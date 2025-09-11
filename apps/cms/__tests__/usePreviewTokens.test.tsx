// apps/cms/__tests__/usePreviewTokens.test.tsx
/* eslint-env jest */

import React from "react";
import { render, screen, act } from "@testing-library/react";
import usePreviewTokens from "../src/app/cms/wizard/usePreviewTokens";
import { PREVIEW_TOKENS_KEY, PREVIEW_TOKENS_EVENT } from "../src/app/cms/wizard/previewTokens";

function Tester() {
  const tokens = usePreviewTokens();
  return <span>{tokens["--color-bg"] || "none"}</span>;
}

describe("usePreviewTokens", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("updates when events fire", async () => {
    localStorage.setItem(
      PREVIEW_TOKENS_KEY,
      JSON.stringify({ "--color-bg": "red" })
    );
    render(<Tester />);
    expect(await screen.findByText("red")).toBeInTheDocument();

    localStorage.setItem(
      PREVIEW_TOKENS_KEY,
      JSON.stringify({ "--color-bg": "blue" })
    );
    await act(async () => {
      window.dispatchEvent(new Event(PREVIEW_TOKENS_EVENT));
    });
    expect(await screen.findByText("blue")).toBeInTheDocument();
  });
});

