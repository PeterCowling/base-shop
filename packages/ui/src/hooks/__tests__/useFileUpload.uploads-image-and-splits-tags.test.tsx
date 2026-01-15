import { act, renderHook } from "@testing-library/react";
import React from "react";
import type { ComponentProps, ForwardedRef, ChangeEvent } from "react";

function createShadcnStub() {
  const Button = React.forwardRef<HTMLButtonElement, ComponentProps<"button">>(
    (props, ref: ForwardedRef<HTMLButtonElement>) => <button ref={ref} {...props} />
  );
  Button.displayName = "Button";
  return { Button };
}

jest.mock("@ui/components/atoms/shadcn", createShadcnStub);

jest.mock("../useImageOrientationValidation.ts", () => ({
  useImageOrientationValidation: jest.fn(),
}));
import { useImageOrientationValidation } from "../useImageOrientationValidation";
import { useFileUpload } from "../useFileUpload";

const mockOrientation =
  useImageOrientationValidation as jest.MockedFunction<
    typeof useImageOrientationValidation
  >;

const originalFetch = global.fetch;
const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ url: "/img.png", altText: "", type: "image" }),
  } as unknown as Response);
  (global as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  mockOrientation.mockReturnValue({ actual: "landscape", isValid: true });
});

afterEach(() => {
  (global as unknown as { fetch: typeof fetch }).fetch = originalFetch as typeof fetch;
  jest.clearAllMocks();
});

it("uploads image and splits tags", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  const onUploaded = jest.fn();

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape", onUploaded })
  );

  mockOrientation.mockClear();

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>);
    result.current.setAltText("alt");
    result.current.setTags("tag1, tag2");
  });

  await act(async () => {
    const promise = result.current.handleUpload();
    expect(result.current.progress).toEqual({ done: 0, total: 1 });
    await promise;
  });

  expect(result.current.progress).toBeNull();
  const body = mockFetch.mock.calls[0][1].body as FormData;
  expect(body.get("tags")).toBe(JSON.stringify(["tag1", "tag2"]));
  expect(onUploaded).toHaveBeenCalled();
  expect(result.current.error).toBeUndefined();
});
