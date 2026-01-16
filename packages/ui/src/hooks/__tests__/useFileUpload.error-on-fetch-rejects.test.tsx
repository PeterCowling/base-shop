import * as React from "react";
import { act, renderHook } from "@testing-library/react";
import { useFileUpload } from "../useFileUpload.tsx";
import { useImageOrientationValidation } from "../useImageOrientationValidation.ts";

function createShadcnStub() {
  const Button = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
    (props, ref) => <button ref={ref} {...props} />
  );
  Button.displayName = "Button";
  return { Button };
}

jest.mock("@ui/components/atoms/shadcn", createShadcnStub);

jest.mock("../useImageOrientationValidation.ts", () => ({
  useImageOrientationValidation: jest.fn(),
}));

const mockOrientation =
  useImageOrientationValidation as jest.MockedFunction<
    typeof useImageOrientationValidation
  >;

const originalFetch = globalThis.fetch;
const mockFetch = jest.fn();

beforeEach(() => {
  Object.defineProperty(globalThis, "fetch", { value: mockFetch, configurable: true });
  mockOrientation.mockReturnValue({ actual: "landscape", isValid: true });
});

afterEach(() => {
  Object.defineProperty(globalThis, "fetch", { value: originalFetch, configurable: true });
  jest.clearAllMocks();
});

it("sets error when upload fetch rejects", async () => {
  mockFetch.mockRejectedValueOnce(new Error("fail"));
  const file = new File(["x"], "x.png", { type: "image/png" });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    const evt = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    result.current.onFileChange(evt);
  });

  await act(async () => {
    await result.current.handleUpload();
  });

  expect(result.current.error).toBe("fail");
});
