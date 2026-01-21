import type { ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfiguratorProvider, useConfigurator } from "../ConfiguratorContext";
import { STORAGE_KEY } from "../hooks/useConfiguratorPersistence";

jest.mock("@acme/platform-core/contexts/LayoutContext", () => ({
  useLayout: () => ({ setConfiguratorProgress: jest.fn() }),
}));

function TestComponent(): ReactElement {
  const { update, markStepComplete, state } = useConfigurator();
  return (
    <>
      <button onClick={() => update("storeName", "My Store")} data-cy="update" />
      <button onClick={() => markStepComplete("intro", "complete")} data-cy="complete" />
      <div data-cy="status">{state.completed.intro}</div>
    </>
  );
}

describe("ConfiguratorContext", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ state: {}, completed: {} }),
      })
    ) as any;
  });

  it("persists updates and step completion", async () => {
    render(
      <ConfiguratorProvider>
        <TestComponent />
      </ConfiguratorProvider>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    await userEvent.click(screen.getByTestId("update"));
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)! ).storeName).toBe("My Store")
    );

    await userEvent.click(screen.getByTestId("complete"));
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("complete")
    );
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(STORAGE_KEY)!).completed.intro
      ).toBe("complete")
    );
  });
});
