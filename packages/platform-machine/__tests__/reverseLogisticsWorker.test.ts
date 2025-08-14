describe("emitReverseLogisticsEvent", () => {
  it("writes events to the repository", async () => {
    const addEvent = jest.fn().mockResolvedValue(undefined);
    jest.doMock(
      "@platform-core/repositories/reverseLogisticsEvents.server",
      () => ({ __esModule: true, addEvent })
    );
    const { emitReverseLogisticsEvent } = await import(
      "@acme/platform-machine/reverseLogisticsWorker"
    );
    await emitReverseLogisticsEvent("shop", "sess1", "received");
    expect(addEvent).toHaveBeenCalledWith("shop", {
      sessionId: "sess1",
      event: "received",
      at: expect.any(String),
    });
  });
});
