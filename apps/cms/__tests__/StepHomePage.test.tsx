import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import StepHomePage from "../src/app/cms/configurator/steps/StepHomePage";
import { STORAGE_KEY } from "../src/app/cms/configurator/hooks/useConfiguratorPersistence";

jest.mock("../src/app/cms/configurator/components/TemplateSelector", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ onConfirm }: any) => (
      <button
        onClick={() =>
          onConfirm("layout-id", [{ id: "comp" }], {
            id: "layout-id",
            name: "Layout",
            components: [{ id: "comp" }],
          })
        }
      >
        choose template
      </button>
    ),
  };
});

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

const pushMock = jest.fn();
const markComplete = jest.fn();

jest.mock("../src/app/cms/configurator/hooks/useStepCompletion", () => ({
  __esModule: true,
  default: () => [false, markComplete],
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const apiRequest = jest.fn();
jest.mock("../src/app/cms/configurator/lib/api", () => ({
  apiRequest: (...args: any[]) => apiRequest(...args),
}));

const setup = (props: Partial<React.ComponentProps<typeof StepHomePage>> = {}) => {
  const defaultProps = {
    pageTemplates: [],
    homeLayout: "",
    setHomeLayout: jest.fn(),
    components: [],
    setComponents: jest.fn(),
    homePageId: null,
    setHomePageId: jest.fn(),
    shopId: "shop",
    themeStyle: {},
  };
  render(<StepHomePage {...defaultProps} {...props} />);
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
  jest.spyOn(window, "dispatchEvent").mockImplementation(() => true);
});

describe("useEffect fetching existing page", () => {
  it("stores history and sets state on success", async () => {
    apiRequest.mockResolvedValueOnce({
      data: [
        {
          id: "p1",
          slug: "",
          components: [{ id: "c" }],
          history: { past: [], present: [], future: [] },
        },
      ],
      error: null,
    });
    const props = setup();
    await waitFor(() => expect(props.setHomePageId).toHaveBeenCalledWith("p1"));
    expect(props.setComponents).toHaveBeenCalledWith([{ id: "c" }]);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "page-builder-history-p1",
      expect.any(String),
    );
  });

  it("shows toast on error", async () => {
    apiRequest.mockResolvedValueOnce({ data: null, error: "load failed" });
    await act(async () => {
      setup();
    });
    await screen.findByText("load failed");
  });
});

describe("Template selection", () => {
  it("persists selection and dispatches event", () => {
    (window.localStorage as any).getItem.mockReturnValue(JSON.stringify({}));
    apiRequest.mockResolvedValueOnce({ data: [], error: null });
    const props = setup();
    fireEvent.click(screen.getByText("choose template"));
    expect(props.setHomeLayout).toHaveBeenCalledWith("layout-id");
    expect(props.setComponents).toHaveBeenCalledWith([{ id: "comp" }]);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify({ homeLayout: "layout-id", components: [{ id: "comp" }] }),
    );
    expect(window.dispatchEvent).toHaveBeenCalled();
    expect((window.dispatchEvent as jest.Mock).mock.calls[0][0].type).toBe(
      "configurator:update",
    );
  });

  it("falls back when storage parsing fails", () => {
    (window.localStorage as any).getItem.mockReturnValue("not-json");
    apiRequest.mockResolvedValueOnce({ data: [], error: null });
    const props = setup();
    expect(() => fireEvent.click(screen.getByText("choose template"))).not.toThrow();
    expect(props.setHomeLayout).toHaveBeenCalledWith("layout-id");
    expect(window.localStorage.setItem).not.toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String),
    );
    expect(window.dispatchEvent).not.toHaveBeenCalled();
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
    expect(props.setHomePageId).toHaveBeenCalledWith("1");
    await act(async () => {
      fireEvent.click(screen.getByText("save"));
    });
    await screen.findByText("save error");
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
    expect(props.setHomePageId).toHaveBeenCalledWith("2");
    await act(async () => {
      fireEvent.click(screen.getByText("publish"));
    });
    await screen.findByText("publish error");
  });
});

describe("navigation buttons", () => {
  it("renders based on step ids and navigates", () => {
    apiRequest.mockResolvedValueOnce({ data: [], error: null });
    setup({
      prevStepId: "prev",
      nextStepId: "next",
      homeLayout: "layout-id",
      homePageId: "home-1",
      components: [{ id: "c1" } as any],
    });
    fireEvent.click(screen.getByText("Back"));
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator/prev");
    fireEvent.click(screen.getByText("Next"));
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator/next");
  });

  it("hides buttons when ids missing", () => {
    apiRequest.mockResolvedValueOnce({ data: [], error: null });
    setup();
    expect(screen.queryByText("Back")).toBeNull();
    expect(screen.queryByText("Next")).toBeNull();
  });
});
