import { ProviderError } from "../../src/providers/types";
import { sendWithRetry } from "../../src/send";

describe("sendWithRetry", () => {
  it("retries on retryable errors with exponential backoff", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    const send = jest
      .fn()
      .mockRejectedValueOnce(new ProviderError("temp", true))
      .mockRejectedValueOnce(new ProviderError("temp", true))
      .mockResolvedValueOnce(undefined);
    await sendWithRetry({ send } as any, {
      to: "t",
      subject: "s",
      html: "<p>h</p>",
      text: "h",
    });
    expect(send).toHaveBeenCalledTimes(3);
    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    timeoutSpy.mockRestore();
  });

  it("stops on non-retryable errors", async () => {
    const send = jest.fn().mockRejectedValue(new ProviderError("fail", false));
    await expect(
      sendWithRetry({ send } as any, {
        to: "t",
        subject: "s",
        html: "<p>h</p>",
        text: "h",
      })
    ).rejects.toThrow("fail");
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("stops when error has retryable false", async () => {
    const error = { retryable: false };
    const send = jest.fn().mockRejectedValue(error);
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    await expect(
      sendWithRetry({ send } as any, {
        to: "t",
        subject: "s",
        html: "<p>h</p>",
        text: "h",
      })
    ).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(1);
    expect(timeoutSpy).not.toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it("retries unknown errors three times", async () => {
    jest.useFakeTimers();
    const error = {};
    const send = jest.fn().mockRejectedValue(error);
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    const promise = sendWithRetry({ send } as any, {
      to: "t",
      subject: "s",
      html: "<p>h</p>",
      text: "h",
    });
    void promise.catch(() => {});
    await jest.advanceTimersByTimeAsync(100);
    await jest.advanceTimersByTimeAsync(200);
    await expect(promise).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(3);
    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    timeoutSpy.mockRestore();
    jest.useRealTimers();
  });
});
