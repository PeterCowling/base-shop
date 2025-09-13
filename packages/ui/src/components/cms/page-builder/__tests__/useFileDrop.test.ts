import { act, renderHook } from "@testing-library/react";
import useFileDrop from "../hooks/useFileDrop";

const mockOnDrop = jest.fn();

jest.mock("../../../../hooks/useFileUpload", () => ({
  __esModule: true,
  default: ({ onUploaded }: any) => ({
    onDrop: (...args: any[]) => {
      mockOnDrop(...args);
      onUploaded({ url: "u", altText: "a" } as any);
    },
    progress: null,
    isValid: true,
  }),
}));

jest.mock("ulid", () => ({
  ulid: () => "test-id",
}));

describe("useFileDrop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("dispatches Image component when drop succeeds", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      useFileDrop({ shop: "shop", dispatch })
    );

    const ev = {} as any;

    act(() => {
      result.current.setDragOver(true);
      result.current.handleFileDrop(ev);
    });

    expect(mockOnDrop).toHaveBeenCalledWith(ev);
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

  it("resets dragOver and logs error when onDrop throws", () => {
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

    const ev = {} as any;

    act(() => {
      result.current.setDragOver(true);
    });

    expect(() =>
      act(() => {
        result.current.handleFileDrop(ev);
      })
    ).not.toThrow();

    expect(mockOnDrop).toHaveBeenCalledWith(ev);
    expect(consoleError).toHaveBeenCalledWith(error);
    expect(dispatch).not.toHaveBeenCalled();
    expect(result.current.dragOver).toBe(false);

    consoleError.mockRestore();
  });
});

