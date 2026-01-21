import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";
import useShiftProgress, {
  ShiftProgress,
  useAutoSaveShiftProgress,
} from "../useShiftProgress";

const KEY = "shift-progress-test";

// simple localStorage mock
const storage: Record<string, string> = {};
const mock = {
  getItem: jest.fn((k: string) => storage[k] ?? null),
  setItem: jest.fn((k: string, v: string) => {
    storage[k] = v;
  }),
  removeItem: jest.fn((k: string) => {
    delete storage[k];
  }),
};

describe("useShiftProgress", () => {
  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    (global as Record<string, unknown>).localStorage = mock;
  });

  it("saves and loads progress", () => {
    const { result } = renderHook(() => useShiftProgress(KEY));
    const data: ShiftProgress = {
      step: 1,
      cash: 5,
      keycards: 2,
      receipts: { a: true },
    };

    act(() => {
      result.current.save(data);
    });

    const loaded = result.current.load();
    expect(loaded).toEqual(data);
  });

  it("auto saves when progress changes", async () => {
    const { rerender } = renderHook(
      ({ data }) => {
        useAutoSaveShiftProgress(KEY, data);
      },
      {
        initialProps: {
          data: {
            step: 0,
            cash: 0,
            keycards: 0,
            receipts: {},
          } as ShiftProgress,
        },
      }
    );

    const updated: ShiftProgress = {
      step: 1,
      cash: 10,
      keycards: 2,
      receipts: { a: true },
    };

    await act(async () => {
      rerender({ data: updated });
    });

    expect(JSON.parse(storage[KEY])).toEqual(updated);
  });
});
