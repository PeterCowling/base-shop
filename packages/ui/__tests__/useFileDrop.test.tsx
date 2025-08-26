import { renderHook, act } from "@testing-library/react";
import useFileDrop from "../src/components/cms/page-builder/hooks/useFileDrop";

const onDropMock = jest.fn().mockResolvedValue(undefined);
const useFileUploadMock = jest.fn(() => ({
  onDrop: onDropMock,
  progress: null,
  isValid: true,
}));

jest.mock("@ui/hooks/useFileUpload", () => ({
  __esModule: true,
  default: (opts: any) => useFileUploadMock(opts),
}));

describe("useFileDrop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("calls onDrop and resets drag state", async () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      useFileDrop({ shop: "shop", dispatch })
    );

    const event = { dataTransfer: "data" } as any;
    await act(async () => {
      result.current.setDragOver(true);
      await result.current.handleFileDrop(event);
    });

    expect(result.current.dragOver).toBe(false);
    expect(onDropMock).toHaveBeenCalledWith(event);
  });

  it("dispatches add action on upload", () => {
    const dispatch = jest.fn();
    renderHook(() => useFileDrop({ shop: "shop", dispatch }));
    const opts = useFileUploadMock.mock.calls[0][0];
    act(() => {
      opts.onUploaded({ url: "u", altText: "a" });
    });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "add" })
    );
  });
});
