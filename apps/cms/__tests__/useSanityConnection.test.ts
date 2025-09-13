import { renderHook, act } from "@testing-library/react";
import { startTransition } from "react";
import { useSanityConnection } from "../src/app/cms/blog/sanity/connect/useSanityConnection";

jest.mock("@cms/actions/saveSanityConfig", () => ({
  saveSanityConfig: jest.fn().mockResolvedValue({ message: "ok" }),
}));

describe("useSanityConnection", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("verifies credentials and lists datasets", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ ok: true, datasets: ["blog"] }),
    });
    const { result } = renderHook(() => useSanityConnection("shop"));
    act(() => {
      result.current.setProjectId("p");
      result.current.setToken("t");
      result.current.setDataset("blog");
    });
    await act(async () => {
      await result.current.verify();
    });
    expect(result.current.verifyStatus).toBe("success");
    expect(result.current.datasets).toEqual(["blog"]);
  });

  it("handles verification errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ ok: false, error: "bad" }),
    });
    const { result } = renderHook(() => useSanityConnection("shop"));
    act(() => {
      result.current.setProjectId("p");
      result.current.setToken("t");
      result.current.setDataset("blog");
    });
    await act(async () => {
      await result.current.verify();
    });
    expect(result.current.verifyStatus).toBe("error");
    expect(result.current.verifyError).toBe("bad");
  });

  it("sets verifyError on network failure", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("net"));
    const { result } = renderHook(() => useSanityConnection("shop"));
    act(() => {
      result.current.setProjectId("p");
      result.current.setToken("t");
      result.current.setDataset("blog");
    });
    await act(async () => {
      await result.current.verify();
    });
    expect(result.current.verifyStatus).toBe("error");
    expect(result.current.verifyError).toBe("Invalid Sanity credentials");
  });

  it("re-verifies after dataset creation", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ ok: true, datasets: ["blog", "new"] }),
    });
    const { result } = renderHook(() =>
      useSanityConnection("shop", { projectId: "p", dataset: "blog", token: "t" })
    );
    await act(async () => {
      await Promise.resolve();
    });
    (global.fetch as jest.Mock).mockClear();
    act(() => {
      result.current.setDataset("new");
      result.current.setIsAddingDataset(true);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
    await act(async () => {
      result.current.handleDatasetSubmit();
      let promise: Promise<any> | undefined;
      startTransition(() => {
        promise = result.current.formAction(new FormData());
      });
      await promise;
    });
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(2);
  });

  it("captures save errors and codes", async () => {
    const { saveSanityConfig } = require("@cms/actions/saveSanityConfig");
    (saveSanityConfig as jest.Mock).mockResolvedValueOnce({
      error: "bad", errorCode: "DATASET_CREATE_ERROR",
    });
    const { result } = renderHook(() => useSanityConnection("shop"));
    await act(async () => {
      let promise: Promise<any> | undefined;
      startTransition(() => {
        promise = result.current.formAction(new FormData());
      });
      await promise;
    });
    expect(result.current.state.error).toBe("bad");
    expect(result.current.state.errorCode).toBe("DATASET_CREATE_ERROR");
  });
});
