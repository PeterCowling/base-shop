import { renderHook, waitFor } from "@testing-library/react";
import { z } from "zod";

import useConfiguratorStep from "../src/app/cms/configurator/steps/hooks/useConfiguratorStep";

const markComplete = jest.fn();
const push = jest.fn();

jest.mock("../src/app/cms/configurator/hooks/useStepCompletion", () => ({
  __esModule: true,
  default: () => [false, markComplete],
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("../src/app/cms/configurator/ConfiguratorContext", () => ({
  useConfigurator: () => ({ state: { shopId: "test-shop" } }),
}));

describe("useConfiguratorStep", () => {
  beforeEach(() => {
    push.mockClear();
    markComplete.mockClear();
  });

  it("keeps errors empty and isValid true for valid values", async () => {
    const schema = z.object({ age: z.number().min(18) });
    const values = { age: 21 };
    const { result } = renderHook(() =>
      useConfiguratorStep({ stepId: "age", schema, values }),
    );
    await waitFor(() => expect(result.current.isValid).toBe(true));
    expect(result.current.errors).toEqual({});
  });

  it("returns first error message for invalid values", async () => {
    const schema = z.object({
      age: z.number().min(18, { message: "Too young" }),
    });
    const values = { age: 10 };
    const { result } = renderHook(() =>
      useConfiguratorStep({ stepId: "age", schema, values }),
    );
    await waitFor(() => expect(result.current.isValid).toBe(false));
    expect(result.current.getError("age")).toBe("Too young");
  });

  it("navigates using goNext and goPrev", () => {
    const schema = z.object({});
    const values = {} as Record<string, never>;
    const { result } = renderHook(() =>
      useConfiguratorStep({
        stepId: "age",
        schema,
        values,
        prevStepId: "prev",
        nextStepId: "next",
      }),
    );
    result.current.goNext();
    result.current.goPrev();
    expect(push).toHaveBeenNthCalledWith(1, "/cms/configurator/next");
    expect(push).toHaveBeenNthCalledWith(2, "/cms/configurator/prev");
  });
});

