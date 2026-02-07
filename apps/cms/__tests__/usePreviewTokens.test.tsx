// apps/cms/__tests__/usePreviewTokens.test.tsx
/* eslint-env jest */

import React from "react";
import { act,render, screen } from "@testing-library/react";

import { PREVIEW_TOKENS_EVENT,PREVIEW_TOKENS_KEY } from "../src/app/cms/wizard/previewTokens";
import usePreviewTokens from "../src/app/cms/wizard/usePreviewTokens";

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

