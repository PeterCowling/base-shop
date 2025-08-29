import { onOpen, onClick, emitOpen, emitClick } from "../hooks";

jest.mock("@platform-core/analytics", () => ({
  trackEvent: jest.fn(),
}));

describe("hooks", () => {
  it("invokes open and click listeners with shop and payload", async () => {
    const shop = "test-shop";
    const payload = { campaign: "spring" };
    const openListener = jest.fn();
    const clickListener = jest.fn();

    onOpen(openListener);
    onClick(clickListener);

    await emitOpen(shop, payload);
    await emitClick(shop, payload);

    expect(openListener).toHaveBeenCalledTimes(1);
    expect(openListener).toHaveBeenCalledWith(shop, payload);
    expect(clickListener).toHaveBeenCalledTimes(1);
    expect(clickListener).toHaveBeenCalledWith(shop, payload);
  });
});
