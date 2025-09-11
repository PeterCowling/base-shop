const captureExceptionSpy = jest.fn();

jest.mock("@sentry/node", () => ({ captureException: captureExceptionSpy }));

describe("captureException", () => {
  it("forwards errors and optional context to sentry", async () => {
    const { captureException } = await import("../sentry.server");

    const error1 = new Error("first");
    await captureException(error1);
    expect(captureExceptionSpy).toHaveBeenCalledWith(error1);

    const error2 = new Error("second");
    const context = { foo: "bar" };
    await captureException(error2, context);
    expect(captureExceptionSpy).toHaveBeenCalledWith(error2, context);
  });
});
