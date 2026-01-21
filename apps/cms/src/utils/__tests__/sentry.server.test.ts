const captureExceptionSpy = jest.fn();
const importMock = jest.fn(() => ({ captureException: captureExceptionSpy }));

jest.mock("@sentry/node", () => importMock());

describe("captureException", () => {
  it("imports module only once and forwards optional context", async () => {
    const { captureException } = await import("../sentry.server");

    const error1 = new Error("first");
    await captureException(error1);

    expect(importMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionSpy).toHaveBeenCalledWith(error1);
    expect(captureExceptionSpy).toHaveBeenCalledTimes(1);

    const error2 = new Error("second");
    const context = { foo: "bar" } as any;
    await captureException(error2, context);

    expect(importMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionSpy).toHaveBeenCalledWith(error2, context);
    expect(captureExceptionSpy).toHaveBeenCalledTimes(2);
  });
});

