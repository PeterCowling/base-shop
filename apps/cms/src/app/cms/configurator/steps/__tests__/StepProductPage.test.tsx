import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import StepProductPage from "../StepProductPage";

const pushMock = jest.fn();
const markComplete = jest.fn();

jest.mock("../../hooks/useStepCompletion", () => ({
  __esModule: true,
  default: () => [false, markComplete],
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const apiRequest = jest.fn();
jest.mock("../../lib/api", () => ({
  apiRequest: (...args: any[]) => apiRequest(...args),
}));

jest.mock("../../../../../../../../test/__mocks__/componentStub.js", () => {
  const React = require("react");
  const Empty = () => null;
  const ProductPageBuilder = ({
    onSave,
    onPublish,
    saveError,
    publishError,
  }: any) => (
    <div>
      {saveError && <div>{saveError}</div>}
      {publishError && <div>{publishError}</div>}
      <button onClick={() => onSave(new FormData())}>save</button>
      <button onClick={() => onPublish(new FormData())}>publish</button>
    </div>
  );
  const Toast = ({ open, message }: any) =>
    open ? <div>{message}</div> : null;
  return new Proxy(
    {},
    {
      get: (_target, prop) =>
        prop === "default" ? ProductPageBuilder : prop === "Toast" ? Toast : Empty,
    },
  );
});

jest.mock("@ui/components/atoms", () => {
  const React = require("react");
  return {
    __esModule: true,
    Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    Toast: ({ open, message }: any) => (open ? <div>{message}</div> : null),
  };
});

jest.mock("@ui/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, onClick }: any) => (
      <button onClick={onClick}>{children}</button>
    ),
    Select: ({ children }: any) => <div>{children}</div>,
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, onSelect }: any) => (
      <div onClick={(e) => onSelect && onSelect(e)}>{children}</div>
    ),
    SelectValue: ({ placeholder }: any) => <div>{placeholder}</div>,
  };
});

const setup = (
  props: Partial<React.ComponentProps<typeof StepProductPage>> = {},
) => {
  const defaultProps = {
    pageTemplates: [],
    productLayout: "",
    setProductLayout: jest.fn(),
    productComponents: [],
    setProductComponents: jest.fn(),
    productPageId: null as string | null,
    setProductPageId: jest.fn(),
    shopId: "shop",
    themeStyle: {},
  };
  render(<StepProductPage {...defaultProps} {...props} />);
  return defaultProps;
};

beforeEach(() => {
  jest.clearAllMocks();
  const store: Record<string, string> = {};
  const localStorageMock = {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      for (const k of Object.keys(store)) delete store[k];
    }),
  };
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    configurable: true,
  });
});

describe("useEffect fetching existing page", () => {
  it("stores history and sets state on success", async () => {
    apiRequest.mockResolvedValueOnce({
      data: [
        {
          id: "p1",
          slug: "product",
          components: [{ id: "c" }],
          history: { past: [], present: [], future: [] },
        },
      ],
      error: null,
    });
    const props = setup();
    await waitFor(() => expect(props.setProductPageId).toHaveBeenCalledWith("p1"));
    expect(props.setProductComponents).toHaveBeenCalledWith([{ id: "c" }]);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "page-builder-history-p1",
      expect.any(String),
    );
  });
});

describe("Template selection", () => {
  it("applies layout and components on confirmation", () => {
    apiRequest.mockResolvedValueOnce({ data: [], error: null });
    const props = setup({
      pageTemplates: [
        { name: "Temp", components: [{ type: "comp" } as any], preview: "" },
      ],
    });
    fireEvent.click(screen.getByText("Temp"));
    fireEvent.click(screen.getByText("Confirm"));
    expect(props.setProductLayout).toHaveBeenCalledWith("Temp");
    expect(props.setProductComponents).toHaveBeenCalledWith([
      expect.objectContaining({ type: "comp", id: expect.any(String) }),
    ]);
  });
});

describe("onSave and onPublish callbacks", () => {
  it("handles save success and error", async () => {
    apiRequest
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: { id: "1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: "save error" });
    const props = setup();
    await act(async () => {
      fireEvent.click(screen.getByText("save"));
    });
    await screen.findByText("Draft saved");
    expect(props.setProductPageId).toHaveBeenCalledWith("1");
    expect(apiRequest).toHaveBeenNthCalledWith(
      2,
      `/cms/api/page-draft/${props.shopId}`,
      { method: "POST", body: expect.any(FormData) },
    );
    await act(async () => {
      fireEvent.click(screen.getByText("save"));
    });
    await screen.findByText("save error");
    expect(apiRequest).toHaveBeenNthCalledWith(
      3,
      `/cms/api/page-draft/${props.shopId}`,
      { method: "POST", body: expect.any(FormData) },
    );
  });

  it("handles publish success and error", async () => {
    apiRequest
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: { id: "2" }, error: null })
      .mockResolvedValueOnce({ data: null, error: "publish error" });
    const props = setup();
    await act(async () => {
      fireEvent.click(screen.getByText("publish"));
    });
    await screen.findByText("Page published");
    expect(props.setProductPageId).toHaveBeenCalledWith("2");
    expect(apiRequest).toHaveBeenNthCalledWith(
      2,
      `/cms/api/page/${props.shopId}`,
      { method: "POST", body: expect.any(FormData) },
    );
    await act(async () => {
      fireEvent.click(screen.getByText("publish"));
    });
    await screen.findByText("publish error");
    expect(apiRequest).toHaveBeenNthCalledWith(
      3,
      `/cms/api/page/${props.shopId}`,
      { method: "POST", body: expect.any(FormData) },
    );
  });
});

describe("Save & return", () => {
  it("marks complete and navigates", () => {
    apiRequest.mockResolvedValueOnce({ data: [], error: null });
    setup();
    fireEvent.click(screen.getByText("Save & return"));
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator");
  });
});
