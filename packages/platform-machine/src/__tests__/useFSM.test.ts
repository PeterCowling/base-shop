import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { useFSM } from "../useFSM";

describe("useFSM", () => {
  function TestComponent() {
    const { state, send } = useFSM<
      "idle" | "loading" | "success" | "fallback",
      "FETCH" | "RESOLVE" | "UNKNOWN"
    >("idle", [
      { from: "idle", event: "FETCH", to: "loading" },
      { from: "loading", event: "RESOLVE", to: "success" },
    ]);

    return React.createElement(
      React.Fragment,
      null,
      React.createElement("span", { "data-testid": "state" }, state),
      React.createElement(
        "button",
        { onClick: () => send("FETCH") },
        "fetch"
      ),
      React.createElement(
        "button",
        { onClick: () => send("RESOLVE") },
        "resolve"
      ),
      React.createElement(
        "button",
        { onClick: () => send("UNKNOWN", () => "fallback") },
        "unknown"
      )
    );
  }

  it("handles transitions and fallback", () => {
    render(React.createElement(TestComponent));
    const state = screen.getByTestId("state");

    expect(state.textContent).toBe("idle");
    fireEvent.click(screen.getByText("fetch"));
    expect(state.textContent).toBe("loading");
    fireEvent.click(screen.getByText("resolve"));
    expect(state.textContent).toBe("success");
    fireEvent.click(screen.getByText("unknown"));
    expect(state.textContent).toBe("fallback");
  });
});

