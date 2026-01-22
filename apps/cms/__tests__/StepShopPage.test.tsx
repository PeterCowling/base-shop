import type React from "react";
import { act,fireEvent, render, screen, waitFor } from "@testing-library/react";

import StepShopPage from "../src/app/cms/configurator/steps/StepShopPage";

// Router mock
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

// Mock UI components
jest.mock("@acme/design-system/shadcn", () => {
  const React = require("react");
  const Button = ({ children, ...props }: any) => <button {...props}>{children}</button>;
  const Select = ({ children }: any) => <div>{children}</div>;
  const SelectContent = ({ children }: any) => <div>{children}</div>;
  const SelectItem = ({ children, onSelect }: any) => (
    <div onClick={onSelect}>{children}</div>
  );
  const SelectTrigger = ({ children }: any) => <div>{children}</div>;
  const SelectValue = ({ placeholder }: any) => <div>{placeholder}</div>;
  return {
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  };
});

jest.mock("@acme/design-system/atoms", () => {
  const React = require("react");
  const Dialog = ({ children }: any) => <div>{children}</div>;
  const DialogContent = ({ children }: any) => <div>{children}</div>;
  const DialogFooter = ({ children }: any) => <div>{children}</div>;
  const DialogHeader = ({ children }: any) => <div>{children}</div>;
  const DialogTitle = ({ children }: any) => <div>{children}</div>;
  const Toast = ({ open, message }: any) => (open ? <div>{message}</div> : null);
  return {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Toast,
  };
});

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img alt={props.alt ?? ""} {...props} />,
}));

// Mock PageBuilder
jest.mock("../../../test/__mocks__/componentStub.js", () => {
  const React = require("react");
  const Empty = () => null;
  const PageBuilder = ({ onSave, onPublish, saveError, publishError }: any) => (
    <div>
      {saveError && <div>{saveError}</div>}
      {publishError && <div>{publishError}</div>}
      <button onClick={() => onSave(new FormData())}>save</button>
      <button onClick={() => onPublish(new FormData())}>publish</button>
    </div>
  );
  const Toast = ({ open, message }: any) => (open ? <div>{message}</div> : null);
  return new Proxy(
    {},
    {
      get: (_target, prop) =>
        prop === "default" ? PageBuilder : prop === "Toast" ? Toast : Empty,
    },
  );
});

// Mock API
const apiRequest = jest.fn();
jest.mock("../src/app/cms/configurator/lib/api", () => ({
  apiRequest: (...args: any[]) => apiRequest(...args),
}));

// Mock configurator context
let state: any;
const update = jest.fn();
const markStepComplete = jest.fn();
const resetDirty = jest.fn();
const setState = jest.fn((updater: any) => {
  state = typeof updater === "function" ? updater(state) : updater;
});

jest.mock("../src/app/cms/configurator/ConfiguratorContext", () => {
  const React = require("react");
  const ConfiguratorContext = React.createContext(null);
  return {
    ConfiguratorContext,
    useConfigurator: () => ({ state, setState, update, markStepComplete, resetDirty }),
  };
});

beforeEach(() => {
  state = { shopPageId: null, completed: {} };
  jest.clearAllMocks();
});

describe("StepShopPage", () => {
  const renderStep = (props: Partial<React.ComponentProps<typeof StepShopPage>> = {}) => {
    const defaultProps = {
      pageTemplates: [],
      shopLayout: "",
      setShopLayout: jest.fn(),
      shopComponents: [],
      setShopComponents: jest.fn(),
      shopPageId: state.shopPageId,
      setShopPageId: (v: string | null) => {
        state.shopPageId = v;
      },
      shopId: "shop",
      themeStyle: {},
      prevStepId: "prev",
      nextStepId: "next",
    };
    render(<StepShopPage {...defaultProps} {...props} />);
  };

  it("shows validation messages on save and publish errors", async () => {
    apiRequest
      .mockResolvedValueOnce({ data: null, error: "save error" })
      .mockResolvedValueOnce({ data: null, error: "publish error" });
    renderStep();
    await act(async () => {
      fireEvent.click(screen.getByText("save"));
    });
    await screen.findByText("save error");
    await act(async () => {
      fireEvent.click(screen.getByText("publish"));
    });
    await screen.findByText("publish error");
  });

  it("does not mark complete without page id", () => {
    renderStep();
    fireEvent.click(screen.getByText("Next"));
    expect(markStepComplete).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator/next");
  });

  it("marks step complete after saving page", async () => {
    apiRequest.mockResolvedValueOnce({ data: { id: "p1" }, error: null });
    renderStep();
    await act(async () => {
      fireEvent.click(screen.getByText("save"));
    });
    await waitFor(() => expect(state.shopPageId).toBe("p1"));
    fireEvent.click(screen.getByText("Next"));
    expect(markStepComplete).toHaveBeenCalledWith("shop-page", "complete");
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator/next");
  });

  it("navigates back when Back clicked", () => {
    renderStep();
    fireEvent.click(screen.getByText("Back"));
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator/prev");
  });
});
