import React, { type ReactElement,useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  type ConfiguratorState,
  configuratorStateSchema,
} from "../../../wizard/schema";
import * as persistence from "../useConfiguratorPersistence";

const { STORAGE_KEY, useConfiguratorPersistence } = persistence;

describe("useConfiguratorPersistence", () => {
  let fetchMock: jest.Mock;
  let complete: ((id: string, status: any) => void) | null = null;

  function TestComponent({ onInvalid }: { onInvalid?: () => void }): ReactElement {
    const [state, setState] = useState<ConfiguratorState>(
      configuratorStateSchema.parse({})
    );
    const [markStepComplete] = useConfiguratorPersistence(
      state,
      setState,
      onInvalid
    );
    complete = markStepComplete;
    return (
      <input
        placeholder="store"
        value={state.storeName}
        onChange={(e) => setState({ ...state, storeName: e.target.value })}
      />
    );
  }

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ state: { storeName: "Server" }, completed: {} }),
      })
      .mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("loads, persists and marks steps", async () => {
    const updateListener = jest.fn();
    window.addEventListener("configurator:update", updateListener);

    render(<TestComponent />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() =>
      expect((screen.getByPlaceholderText("store") as HTMLInputElement).value).toBe("Server")
    );
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).storeName).toBe("Server");

    fireEvent.change(screen.getByPlaceholderText("store"), {
      target: { value: "Updated" },
    });
    act(() => {
      jest.runOnlyPendingTimers();
    });
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/cms/api/configurator-progress",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining("Updated"),
        })
      )
    );
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).storeName).toBe("Updated");

    fetchMock.mockClear();
    updateListener.mockClear();

    act(() => complete!("intro", "complete"));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/cms/api/configurator-progress",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ stepId: "intro", completed: "complete" }),
        })
      )
    );
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).completed.intro).toBe("complete");
    expect(updateListener).toHaveBeenCalled();
  });

  it("notifies when persisted state is invalid", async () => {
    const onInvalid = jest.fn();
    fetchMock.mockReset().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: { storeName: 123 }, completed: {} }),
    });

    render(<TestComponent onInvalid={onInvalid} />);

    await waitFor(() => expect(onInvalid).toHaveBeenCalled());
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
