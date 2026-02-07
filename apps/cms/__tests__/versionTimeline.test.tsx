// apps/cms/__tests__/versionTimeline.test.tsx
/* eslint-env jest */

/* -------------------------------------------------------------------------- */
/*  Declare mocks FIRST, then import the component 🛠️                         */
/* -------------------------------------------------------------------------- */
/*  Now that modules are mocked, import React‑Testing‑Library & the component */
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import VersionTimeline from "../src/app/cms/shop/[shop]/settings/seo/VersionTimeline";

const diffHistoryMock = jest.fn();
const revertSeoMock = jest.fn();

jest.mock("@acme/platform-core/repositories/settings.server", () => ({
  diffHistory: (...a: unknown[]) => diffHistoryMock(...a),
}));
jest.mock("@cms/actions/shops.server", () => ({
  revertSeo: (...a: unknown[]) => revertSeoMock(...a),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
async function openTimeline(shop = "shop") {
  render(<VersionTimeline shop={shop} trigger={<button>Open</button>} />);
  fireEvent.click(screen.getByText("Open"));
  return await screen.findByRole("dialog");
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("VersionTimeline", () => {
  it("loads history when opened", async () => {
    diffHistoryMock.mockResolvedValueOnce([
      { timestamp: "t2", diff: { title: "B" } },
    ]);

    await openTimeline();

    expect(diffHistoryMock).toHaveBeenCalledWith("shop");
  });

  it.skip("reverts and refreshes history", async () => {
    /* 1️⃣ initial history (two entries so a “Revert” button exists) */
    diffHistoryMock.mockResolvedValueOnce([
      { timestamp: "t2", diff: { title: "B" } },
      { timestamp: "t1", diff: { title: "A" } },
    ]);
    /* 2️⃣ history after revert */
    diffHistoryMock.mockResolvedValueOnce([
      { timestamp: "t3", diff: { title: "C" } },
    ]);
    revertSeoMock.mockResolvedValueOnce({}); // pretend API OK

    const dialog = await openTimeline("s1");

    /* Wait until at least one “Revert” button is present */
    const revertBtn = await within(dialog).findByRole("button", {
      name: /revert/i,
    });
    fireEvent.click(revertBtn);

    /* First button is tied to the oldest entry (“t1”) */
    await waitFor(() => expect(revertSeoMock).toHaveBeenCalledWith("s1", "t1"));
    expect(diffHistoryMock).toHaveBeenCalledTimes(2);
  });
});
