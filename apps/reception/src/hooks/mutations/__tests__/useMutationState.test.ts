import { act, renderHook } from "@testing-library/react";

import useMutationState from "../useMutationState";

describe("useMutationState", () => {
  // TC-01: initial state
  it("returns loading=false and error=null initially", () => {
    const { result } = renderHook(() => useMutationState());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // TC-03: run completes successfully → loading=false, error=null
  it("sets loading=false and error=null after successful run", async () => {
    const { result } = renderHook(() => useMutationState());

    await act(async () => {
      await result.current.run(async () => {
        // no-op success
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // TC-04: run fails → loading=false, error set to thrown value
  it("sets error state and loading=false when fn throws", async () => {
    const { result } = renderHook(() => useMutationState());
    const thrownError = new Error("test error");

    await act(async () => {
      await result.current
        .run(async () => {
          throw thrownError;
        })
        .catch(() => {
          // expected rejection
        });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(thrownError);
  });

  // TC-05: run re-throws error to caller
  it("re-throws the error to the caller", async () => {
    const { result } = renderHook(() => useMutationState());
    const thrownError = new Error("rethrow test");

    await expect(
      act(async () => {
        await result.current.run(async () => {
          throw thrownError;
        });
      })
    ).rejects.toThrow("rethrow test");
  });

  // TC-06: setLoading / setError work directly (manual variant)
  it("allows manual state updates via setLoading and setError", async () => {
    const { result } = renderHook(() => useMutationState());
    const manualError = new Error("manual");

    act(() => {
      result.current.setLoading(true);
      result.current.setError(manualError);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(manualError);

    act(() => {
      result.current.setLoading(false);
      result.current.setError(null);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // Verify error is cleared at start of each run() call (no stale errors)
  it("clears error from previous failure at start of next run", async () => {
    const { result } = renderHook(() => useMutationState());

    // First call — fails
    await act(async () => {
      await result.current
        .run(async () => {
          throw new Error("first failure");
        })
        .catch(() => {});
    });

    expect(result.current.error).not.toBe(null);

    // Second call — succeeds
    await act(async () => {
      await result.current.run(async () => {
        // success
      });
    });

    expect(result.current.error).toBe(null);
  });
});
