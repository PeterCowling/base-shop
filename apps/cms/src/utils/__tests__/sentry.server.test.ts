const captureExceptionSpy = jest.fn();
const importMock = jest.fn(() => ({ captureException: captureExceptionSpy }));

jest.mock("@sentry/node", () => importMock());

describe("captureException", () => {
  it("imports module only once and forwards errors", async () => {
    const { captureException } = await import("../sentry.server");

    const error1 = new Error("first");
    const context = { foo: "bar" };
    await captureException(error1, context);

    expect(importMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionSpy).toHaveBeenCalledWith(error1, context);

    const error2 = new Error("second");
    await captureException(error2);

    expect(importMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionSpy).toHaveBeenCalledWith(error2);
    expect(captureExceptionSpy).toHaveBeenCalledTimes(2);
  });
});
