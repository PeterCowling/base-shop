import "@testing-library/jest-dom";
import React from "react";
import { render, waitFor } from "@testing-library/react";

const track = jest.fn();

jest.mock("@acme/telemetry", () => ({
  track,
}));

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => key,
}));

import DesignSystemImportPage from "../src/app/cms/shop/[shop]/import/design-system/page";

describe("DesignSystemImportPage", () => {
  afterEach(() => {
    track.mockClear();
  });

  it("tracks page view once", async () => {
    render(<DesignSystemImportPage />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("designsystem:import:view", {});
    });
  });
});
