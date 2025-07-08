// apps/cms/__tests__/versionTimeline.test.tsx
/* eslint-env jest */
import { fireEvent, render, screen } from "@testing-library/react";
import { TextDecoder, TextEncoder } from "node:util";
import { MessageChannel } from "node:worker_threads";
import VersionTimeline from "../src/app/cms/shop/[shop]/settings/seo/VersionTimeline";

/* -------------------------------------------------------------------------- */
/*  JSDOM/browser polyfills                                                   */
/* -------------------------------------------------------------------------- */
(globalThis as any).MessageChannel = MessageChannel;
(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder = TextDecoder;

/* -------------------------------------------------------------------------- */
/*  Mocks for the repo + server actions                                       */
/* -------------------------------------------------------------------------- */
import { diffHistoryMock } from "./__mocks__/repo";
const revertSeoMock = jest.fn();

jest.mock("@platform-core/repositories/settings.server", () => ({
  diffHistory: (...args: unknown[]) => diffHistoryMock(...args),
}));

jest.mock("@cms/actions/shops.server", () => ({
  revertSeo: (...args: unknown[]) => revertSeoMock(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("VersionTimeline", () => {
  it("loads history when opened", async () => {
    diffHistoryMock.mockResolvedValueOnce([
      { timestamp: "t1", diff: { title: "A" } },
    ]);

    render(<VersionTimeline shop="shop" trigger={<button>Open</button>} />);
    fireEvent.click(screen.getByText("Open"));

    // JSON diff is rendered inside a <pre>, so match the quoted value
    await screen.findByText(/"A"/);

    expect(diffHistoryMock).toHaveBeenCalledWith("shop");
  });

  it("reverts and refreshes history", async () => {
    diffHistoryMock.mockResolvedValueOnce([
      { timestamp: "t1", diff: { title: "A" } },
    ]);
    diffHistoryMock.mockResolvedValueOnce([
      { timestamp: "t2", diff: { title: "B" } },
    ]);
    revertSeoMock.mockResolvedValueOnce({}); // pretend server accepted revert

    render(<VersionTimeline shop="s1" trigger={<button>Open</button>} />);
    fireEvent.click(screen.getByText("Open"));

    await screen.findByText(/"A"/); // initial diff visible
    fireEvent.click(screen.getByText("Revert")); // click “Revert” button

    // After revert, component should re-fetch and show the new diff
    await screen.findByText(/"B"/);

    expect(revertSeoMock).toHaveBeenCalledWith("s1", "t1");
    expect(diffHistoryMock).toHaveBeenCalledTimes(2); // initial load + refresh
  });
});
