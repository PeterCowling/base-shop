/* eslint-env jest */

import React, { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  STORAGE_KEY,
  useConfiguratorPersistence,
} from "../src/app/cms/configurator/hooks/useConfiguratorPersistence";
import {
  type ConfiguratorState,
  configuratorStateSchema,
} from "../src/app/cms/wizard/schema";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.spyOn(global, "fetch").mockRejectedValue(new Error("unmocked"));
  localStorage.clear();
});

afterEach(() => {
  (global.fetch as jest.Mock).mockRestore();
  localStorage.clear();
});

function TestConfigurator() {
  const [state, setState] = useState<ConfiguratorState>(
    configuratorStateSchema.parse({})
  );
  useConfiguratorPersistence(state, setState);
  return (
    <input
      placeholder="theme"
      value={state.theme ?? ""}
      onChange={(e) => setState({ ...state, theme: e.target.value })}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("Configurator progress persistence", () => {
  it("restores progress after a reload", async () => {
    jest.useFakeTimers();
    const { unmount } = render(<TestConfigurator />);

    fireEvent.change(screen.getByPlaceholderText("theme"), {
      target: { value: "dark" },
    });

    jest.runOnlyPendingTimers();

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...persisted }),
    });

    unmount();

    render(<TestConfigurator />);

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText("theme") as HTMLInputElement).value
      ).toBe("dark");
    });

    jest.useRealTimers();
  });
});

