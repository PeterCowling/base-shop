import { fireEvent, render, screen } from "@testing-library/react";
import VersionTimeline from "../src/app/cms/shop/[shop]/settings/seo/VersionTimeline";

const diffHistoryMock = jest.fn();
const revertSeoMock = jest.fn();

jest.mock("@platform-core/repositories/settings.server", () => ({
  diffHistory: (...args: any[]) => diffHistoryMock(...args),
}));

jest.mock("@cms/actions/shops.server", () => ({
  revertSeo: (...args: any[]) => revertSeoMock(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("VersionTimeline", () => {
  it("loads history when opened", async () => {
    diffHistoryMock.mockResolvedValueOnce([
      { timestamp: "t1", diff: { title: "A" } },
    ]);

    render(<VersionTimeline shop="shop" trigger={<button>Open</button>} />);
    fireEvent.click(screen.getByText("Open"));

    await screen.findByText("A");
    expect(diffHistoryMock).toHaveBeenCalledWith("shop");
  });

  it("reverts and refreshes history", async () => {
    diffHistoryMock.mockResolvedValueOnce([
      { timestamp: "t1", diff: { title: "A" } },
    ]);
    diffHistoryMock.mockResolvedValueOnce([
      { timestamp: "t2", diff: { title: "B" } },
    ]);
    revertSeoMock.mockResolvedValueOnce({});

    render(<VersionTimeline shop="s1" trigger={<button>Open</button>} />);
    fireEvent.click(screen.getByText("Open"));

    await screen.findByText("A");
    fireEvent.click(screen.getByText("Revert"));

    await screen.findByText("B");
    expect(revertSeoMock).toHaveBeenCalledWith("s1", "t1");
    expect(diffHistoryMock).toHaveBeenCalledTimes(2);
  });
});
