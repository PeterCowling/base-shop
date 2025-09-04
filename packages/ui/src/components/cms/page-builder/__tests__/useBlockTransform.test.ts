import { renderHook } from "@testing-library/react";
import useBlockTransform from "../useBlockTransform";
import useCanvasDrag from "../useCanvasDrag";
import useCanvasResize from "../useCanvasResize";

jest.mock("../useCanvasDrag");
jest.mock("../useCanvasResize");

const mockUseCanvasDrag = useCanvasDrag as unknown as jest.Mock;
const mockUseCanvasResize = useCanvasResize as unknown as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

test("returns resize guides when present", () => {
  mockUseCanvasResize.mockReturnValue({
    startResize: jest.fn(),
    guides: { x: 1, y: 2 },
    snapping: false,
  });
  mockUseCanvasDrag.mockReturnValue({
    startDrag: jest.fn(),
    guides: { x: 3, y: 4 },
    snapping: true,
  });
  const ref = { current: null } as any;
  const dispatch = jest.fn();
  const { result } = renderHook(() =>
    useBlockTransform("c1", {
      widthKey: "w",
      heightKey: "h",
      widthVal: "10px",
      heightVal: "10px",
      dispatch,
      gridCols: 12,
      containerRef: ref,
    }),
  );
  expect(result.current.guides).toEqual({ x: 1, y: 2 });
  expect(result.current.snapping).toBe(true);
});

test("falls back to drag guides", () => {
  mockUseCanvasResize.mockReturnValue({
    startResize: jest.fn(),
    guides: { x: null, y: null },
    snapping: true,
  });
  mockUseCanvasDrag.mockReturnValue({
    startDrag: jest.fn(),
    guides: { x: 5, y: 6 },
    snapping: false,
  });
  const ref = { current: null } as any;
  const dispatch = jest.fn();
  const { result } = renderHook(() =>
    useBlockTransform("c1", {
      widthKey: "w",
      heightKey: "h",
      widthVal: "10px",
      heightVal: "10px",
      dispatch,
      gridCols: 12,
      containerRef: ref,
    }),
  );
  expect(result.current.guides).toEqual({ x: 5, y: 6 });
  expect(result.current.snapping).toBe(true);
});
