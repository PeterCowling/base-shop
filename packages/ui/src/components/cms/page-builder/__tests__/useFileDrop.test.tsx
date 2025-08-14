import { act, renderHook } from "@testing-library/react";
import useFileDrop from "../hooks/useFileDrop";
import type { Action } from "../state";

const mockOnDrop = jest.fn().mockResolvedValue(undefined);
jest.mock("@ui/hooks/useFileUpload", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    onDrop: mockOnDrop,
    progress: null,
    isValid: true,
  })),
}));

test("handles file drop and resets drag state", async () => {
  const dispatch = jest.fn();
  const { result } = renderHook(() =>
    useFileDrop({ shop: "test", dispatch: dispatch as React.Dispatch<Action> })
  );
  act(() => {
    result.current.setDragOver(true);
  });
  expect(result.current.dragOver).toBe(true);
  const data = {} as DataTransfer;
  await act(async () => {
    await result.current.handleFileDrop({ dataTransfer: data } as any);
  });
  expect(mockOnDrop).toHaveBeenCalledWith(data);
  expect(result.current.dragOver).toBe(false);
});

