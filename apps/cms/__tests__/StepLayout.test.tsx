import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import StepLayout from "../src/app/cms/configurator/steps/StepLayout";

// Mocks for router and theme loader
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

jest.mock("../src/app/cms/configurator/hooks/useThemeLoader", () => ({
  useThemeLoader: () => ({}),
}));

// Mock components and PageBuilder
jest.mock("../../../test/__mocks__/componentStub.js", () => {
  const React = require("react");
  const Empty = () => null;
  const PageBuilder = ({ onSave }: any) => (
    <div>
      <button onClick={() => onSave(new FormData())}>save</button>
    </div>
  );
  const Toast = ({ open, message }: any) => (open ? <div>{message}</div> : null);
  const Spinner = () => <div>spinner</div>;
   const Alert = ({ heading, title, children }: any) => (
     <div>
       {heading || title}
       {children}
     </div>
   );
  return new Proxy(
    {},
    {
      get: (_target, prop) =>
        prop === "default"
          ? PageBuilder
          : prop === "Toast"
            ? Toast
            : prop === "Spinner"
              ? Spinner
              : prop === "Alert"
                ? Alert
                : Empty,
    },
  );
});

// Mock API request
const apiRequest = jest.fn();
jest.mock("../src/app/cms/configurator/lib/api", () => ({
  apiRequest: (...args: any[]) => apiRequest(...args),
}));

// Mock configurator context
let state: any;
const update = jest.fn((key: string, value: any) => {
  state[key] = value;
});
const markStepComplete = jest.fn();
const resetDirty = jest.fn();

jest.mock("../src/app/cms/configurator/ConfiguratorContext", () => ({
  useConfigurator: () => ({ state, update, markStepComplete, resetDirty }),
}));

beforeEach(() => {
  state = {
    headerComponents: [],
    footerComponents: [],
    headerPageId: null,
    footerPageId: null,
    shopId: "shop",
    completed: {},
  };
  jest.clearAllMocks();
});

describe("StepLayout", () => {
  it("shows error when header save fails", async () => {
    apiRequest.mockResolvedValueOnce({ data: null, error: "save error" });
    render(<StepLayout />);
    fireEvent.click(screen.getAllByText("save")[0]);
    await waitFor(() => expect(apiRequest).toHaveBeenCalled());
    await screen.findByText("save error");
  });

  it("marks step complete when header and footer saved", async () => {
    apiRequest
      .mockResolvedValueOnce({ data: { id: "h1" }, error: null })
      .mockResolvedValueOnce({ data: { id: "f1" }, error: null });
    render(<StepLayout />);
    fireEvent.click(screen.getAllByText("save")[0]);
    await waitFor(() => expect(state.headerPageId).toBe("h1"));
    fireEvent.click(screen.getAllByText("save")[1]);
    await waitFor(() => expect(state.footerPageId).toBe("f1"));
    await waitFor(() =>
      expect(screen.getByText("Save & return")).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByText("Save & return"));
    expect(markStepComplete).toHaveBeenCalledWith("layout", "complete");
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator");
  });

  it("does not mark complete when ids missing", () => {
    render(<StepLayout />);
    fireEvent.click(screen.getByText("Save & return"));
    expect(markStepComplete).not.toHaveBeenCalled();
  });
});
