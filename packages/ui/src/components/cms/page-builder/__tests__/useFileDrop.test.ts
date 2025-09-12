import { act, renderHook } from "@testing-library/react";
import useFileDrop from "../hooks/useFileDrop";

const mockOnDrop = jest.fn();
let uploaded: ((item: any) => void) | undefined;

jest.mock("../../../../hooks/useFileUpload", () => ({
  __esModule: true,
  default: (opts: any) => {
    uploaded = opts.onUploaded;
    return {
      onDrop: (...args: any[]) => mockOnDrop(...args),
      progress: null,
      isValid: true,
    };
  },
}));

jest.mock("ulid", () => ({
  ulid: () => "test-id",
}));

describe("useFileDrop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploaded = undefined;
  });

  it("toggles dragOver state", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      useFileDrop({ shop: "s1", dispatch })
    );

    expect(result.current.dragOver).toBe(false);
    act(() => {
      result.current.setDragOver(true);
    });
    expect(result.current.dragOver).toBe(true);
    act(() => {
      result.current.setDragOver(false);
    });
    expect(result.current.dragOver).toBe(false);
  });

  it("dispatches add action when drop succeeds", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      useFileDrop({ shop: "shop", dispatch })
    );

    const item = { url: "u", altText: "a" } as any;
    mockOnDrop.mockImplementation(() => {
      uploaded?.(item);
    });

    act(() => {
      result.current.setDragOver(true);
      result.current.handleFileDrop({} as any);
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "add",
      component: {
        id: "test-id",
        type: "Image",
        src: "u",
        alt: "a",
      },
    });
    expect(result.current.dragOver).toBe(false);
  });

  it("catches errors from onDrop without throwing", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      useFileDrop({ shop: "s1", dispatch })
    );

    const error = new Error("fail");
    mockOnDrop.mockImplementation(() => {
      throw error;
    });

    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() =>
      act(() => {
        result.current.handleFileDrop({} as any);
      })
    ).not.toThrow();

    expect(consoleError).toHaveBeenCalledWith(error);
    expect(dispatch).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

