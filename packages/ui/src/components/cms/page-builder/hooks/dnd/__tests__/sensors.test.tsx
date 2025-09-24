// packages/ui/src/components/cms/page-builder/hooks/dnd/__tests__/sensors.test.tsx
import { renderHook } from "@testing-library/react";
import { useDndSensors } from "../sensors";

describe("useDndSensors", () => {
  test("returns sensors definition without throwing", () => {
    const { result } = renderHook(() => useDndSensors());
    expect(result.current).toBeTruthy();
  });
});

