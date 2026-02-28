import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import StickyBookNow from "@acme/ui/organisms/StickyBookNow";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: "en", hasResourceBundle: () => true, getFixedT: () => (k: string) => k },
    ready: true,
  }),
}));

describe("StickyBookNow octorateUrl prop", () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
    jest.setSystemTime(new Date("2026-02-15T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("TC-01: uses provided octorateUrl as href", () => {
    render(
      <StickyBookNow octorateUrl="https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&room=433883" />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&room=433883",
    );
  });

  it("TC-02: falls back to internal calendar.xhtml deep link when octorateUrl is absent", () => {
    render(<StickyBookNow />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      expect.stringMatching(
        /^https:\/\/book\.octorate\.com\/octobook\/site\/reservation\/calendar\.xhtml/,
      ),
    );
  });
});
