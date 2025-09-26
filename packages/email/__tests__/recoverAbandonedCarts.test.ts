describe("recoverAbandonedCarts", () => {
  it("sends reminders only for eligible carts and marks them reminded", async () => {
    jest.resetModules();
    const sendCampaignEmail = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../src/send", () => ({ sendCampaignEmail }));
    const { recoverAbandonedCarts } = await import("../src/abandonedCart");

    const now = 1000;
    const delay = 100;
    const carts = [
      { email: "old1@example.com", cart: {}, updatedAt: now - delay - 1 },
      { email: "old2@example.com", cart: {}, updatedAt: now - delay - 2, reminded: true },
      { email: "recent@example.com", cart: {}, updatedAt: now - delay + 5 },
      { email: "old3@example.com", cart: {}, updatedAt: now - delay - 3 },
    ];

    await recoverAbandonedCarts(carts, now, delay);

    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    expect(sendCampaignEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: "old1@example.com",
        subject: "You left items in your cart",
        html: expect.stringContaining("You left items in your cart"),
      }),
    );
    expect(sendCampaignEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: "old3@example.com",
        subject: "You left items in your cart",
        html: expect.stringContaining("You left items in your cart"),
      }),
    );

    expect(carts[0].reminded).toBe(true);
    expect(carts[1].reminded).toBe(true);
    expect(carts[2].reminded).toBeUndefined();
    expect(carts[3].reminded).toBe(true);
  });
});

