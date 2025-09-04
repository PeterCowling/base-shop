import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TokenInspector from "../TokenInspector";

jest.mock("@ui/components/atoms", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: (props: any) => <button {...props} />,
    Popover: ({ open, children }: any) => (open ? <div data-testid="popover">{children}</div> : null),
    PopoverAnchor: ({ children }: any) => <>{children}</>,
    PopoverContent: ({ children }: any) => <div>{children}</div>,
  };
});

describe("TokenInspector", () => {
  it("highlights tokens, navigates, and emits selection", async () => {
    const onTokenSelect = jest.fn();
    render(
      <TokenInspector inspectMode onTokenSelect={onTokenSelect}>
        <div data-testid="preview">
          <div data-token="token-a">A</div>
          <div data-token="token-b">B</div>
        </div>
      </TokenInspector>
    );

    const preview = screen.getByTestId("preview");
    const tokens = preview.querySelectorAll<HTMLElement>("[data-token]");
    const [t1, t2] = Array.from(tokens);
    t1.getBoundingClientRect = () => ({
      left: 10,
      top: 0,
      width: 10,
      height: 10,
      right: 20,
      bottom: 10,
    } as DOMRect);
    t2.getBoundingClientRect = () => ({
      left: 50,
      top: 0,
      width: 10,
      height: 10,
      right: 60,
      bottom: 30,
    } as DOMRect);

    fireEvent.pointerMove(t1);
    await waitFor(() =>
      expect(t1.style.outline).toBe("2px solid hsl(var(--color-primary))")
    );

    fireEvent.click(t1);
    await screen.findByText("token-a");
    expect(screen.getByTestId("popover")).toBeInTheDocument();
    expect(t1.style.animation).toBe("wizard-outline 1s ease-in-out infinite");

    fireEvent.keyDown(window, { key: "ArrowRight", altKey: true });
    await screen.findByText("token-b");
    expect(t1.style.animation).toBe("");
    expect(t2.style.animation).toBe("wizard-outline 1s ease-in-out infinite");

    fireEvent.keyDown(window, { key: "ArrowLeft", altKey: true });
    await screen.findByText("token-a");

    fireEvent.click(screen.getByText("Jump to editor"));
    expect(onTokenSelect).toHaveBeenCalledWith("token-a", { x: 15, y: 10 });
  });
});

