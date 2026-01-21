import {
  InvalidProductProvider,
  useInvalidProductContext,
} from "@cms/app/cms/blog/posts/invalidProductContext";
import { act,renderHook } from "@testing-library/react";

describe("InvalidProductContext", () => {
  it("tracks invalid products", () => {
    const wrapper = ({ children }: any) => (
      <InvalidProductProvider>{children}</InvalidProductProvider>
    );
    const { result } = renderHook(() => useInvalidProductContext(), { wrapper });
    act(() => result.current.markValidity("k1", false, "p1"));
    expect(result.current.invalidProducts).toEqual({ k1: "p1" });
    act(() => result.current.markValidity("k1", true, "p1"));
    expect(result.current.invalidProducts).toEqual({});
  });
});
