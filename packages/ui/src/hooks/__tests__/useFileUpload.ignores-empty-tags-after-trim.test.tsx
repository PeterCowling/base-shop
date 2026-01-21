import * as React from "react";
import { act, renderHook } from "@testing-library/react";

import { useFileUpload } from "../useFileUpload.tsx";

function createShadcnStub() {
  const Button = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
    (props, ref) => <button ref={ref} {...props} />
  );
  Button.displayName = "Button";
  return { Button };
}

jest.mock("@acme/ui/components/atoms/shadcn", createShadcnStub);

jest.mock("../useImageOrientationValidation.ts", () => ({
  useImageOrientationValidation: jest.fn(() => ({ actual: "landscape", isValid: true })),
}));

const originalFetch = globalThis.fetch;
const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ url: "/img.png", altText: "", type: "image" }),
  } as unknown as Response);
  Object.defineProperty(globalThis, "fetch", { value: mockFetch, configurable: true });
});

afterEach(() => {
  Object.defineProperty(globalThis, "fetch", { value: originalFetch, configurable: true });
  jest.clearAllMocks();
});

it("ignores empty tags after trimming", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    const evt = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    result.current.onFileChange(evt);
    result.current.setTags(" , ");
  });

  await act(async () => {
    await result.current.handleUpload();
  });

  const body = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1]
    .body as FormData;
  expect(body.has("tags")).toBe(false);
  expect(result.current.error).toBeUndefined();
});
