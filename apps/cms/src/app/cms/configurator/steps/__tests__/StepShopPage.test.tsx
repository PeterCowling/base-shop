import type React from "react";
import { act,fireEvent, render, screen } from "@testing-library/react";

import { STORAGE_KEY } from "../../hooks/useConfiguratorPersistence";
import StepShopPage from "../StepShopPage";

// Mocks
const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const markComplete = jest.fn();
jest.mock("../../hooks/useStepCompletion", () => ({
  __esModule: true,
  default: () => [false, markComplete],
}));

jest.mock("../../hooks/useThemeLoader", () => ({
  __esModule: true,
  useThemeLoader: () => ({}),
}));

jest.mock("next/image", () => {
  const React = require("react");
  // Stub that avoids <img> to satisfy ds/no-naked-img and a11y rules in tests
  const MockNextImage = (props: any) => <div data-testid="next-image" {...props} />;
  MockNextImage.displayName = "MockNextImage";
  return {
    __esModule: true,
    default: MockNextImage,
  };
});

jest.mock("@acme/ui/components/atoms/shadcn", () => {
  const React = require("react");
  const Button = ({ children, ...props }: any) => <button {...props}>{children}</button>;
  Button.displayName = "MockButton";
  const Select = ({ children, open, onOpenChange, onValueChange, value, ...props }: any) => (
    <div {...props}>{children}</div>
  );
  Select.displayName = "MockSelect";
  const SelectContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  SelectContent.displayName = "MockSelectContent";
  const SelectItem = ({ children, onSelect, asChild, ...props }: any) => (
    <div onClick={onSelect} {...props}>
      {children}
    </div>
  );
  SelectItem.displayName = "MockSelectItem";
  const SelectTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  SelectTrigger.displayName = "MockSelectTrigger";
  const SelectValue = ({ placeholder }: any) => <div>{placeholder}</div>;
  SelectValue.displayName = "MockSelectValue";
  return {
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  };
});

jest.mock("@acme/ui/components/atoms", () => {
  const React = require("react");
  const Dialog = ({ open, children }: any) => (open ? <div>{children}</div> : null);
  Dialog.displayName = "MockDialog";
  const DialogContent = ({ children }: any) => <div>{children}</div>;
  DialogContent.displayName = "MockDialogContent";
  const DialogFooter = ({ children }: any) => <div>{children}</div>;
  DialogFooter.displayName = "MockDialogFooter";
  const DialogHeader = ({ children }: any) => <div>{children}</div>;
  DialogHeader.displayName = "MockDialogHeader";
  const DialogTitle = ({ children }: any) => <div>{children}</div>;
  DialogTitle.displayName = "MockDialogTitle";
  const Toast = ({ open, message }: any) => (open ? <div>{message}</div> : null);
  Toast.displayName = "MockToast";
  return {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Toast,
  };
});

jest.mock("@/components/cms/PageBuilder", () => {
  const React = require("react");
  const MockPageBuilder = ({ onSave, onPublish }: any) => (
    <div>
      <button onClick={() => onSave(new FormData())}>save</button>
      <button onClick={() => onPublish(new FormData())}>publish</button>
    </div>
  );
  MockPageBuilder.displayName = "MockPageBuilder";
  return {
    __esModule: true,
    default: MockPageBuilder,
  };
});

const apiRequest = jest.fn();
jest.mock("../../lib/api", () => ({
  apiRequest: (...args: any[]) => apiRequest(...args),
}));

describe("StepShopPage", () => {
  const renderStep = (
    props: Partial<React.ComponentProps<typeof StepShopPage>> = {},
  ) => {
    const defaultProps = {
      pageTemplates: [],
      shopLayout: "",
      setShopLayout: jest.fn(),
      shopComponents: [],
      setShopComponents: jest.fn(),
      shopPageId: null,
      setShopPageId: jest.fn(),
      shopId: "shop",
      themeStyle: {},
      prevStepId: "prev",
      nextStepId: "next",
    };
    render(<StepShopPage {...defaultProps} {...props} />);
    return defaultProps;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const store: Record<string, string> = {};
    const ls = {
      getItem: jest.fn((k: string) => store[k] ?? null),
      setItem: jest.fn((k: string, v: string) => {
        store[k] = v;
      }),
      removeItem: jest.fn((k: string) => {
        delete store[k];
      }),
      clear: jest.fn(() => {
        for (const k of Object.keys(store)) delete store[k];
      }),
    };
    Object.defineProperty(window, "localStorage", {
      value: ls,
      configurable: true,
    });
    jest.spyOn(window, "dispatchEvent").mockImplementation(() => true);
  });

  it("selects template and persists to storage", () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));
    const tpl = { name: "fancy", components: [{ type: "hero" } as any], preview: "" };
    const props = renderStep({ pageTemplates: [tpl] });
    fireEvent.click(screen.getByTestId("template-fancy"));
    expect(screen.getByText("Use fancy template?"))
      .toBeInTheDocument();
    fireEvent.click(screen.getByTestId("confirm-template"));
    expect(props.setShopLayout).toHaveBeenCalledWith("fancy");
    expect(props.setShopComponents).toHaveBeenCalledWith([
      expect.objectContaining({ type: "hero" }),
    ]);
    const call = (window.localStorage.setItem as jest.Mock).mock.calls[0];
    expect(call[0]).toBe(STORAGE_KEY);
    expect(JSON.parse(call[1])).toMatchObject({
      shopLayout: "fancy",
      shopComponents: [expect.objectContaining({ type: "hero" })],
    });
  });

  it("saves and publishes page via API", async () => {
    apiRequest
      .mockResolvedValueOnce({ data: { id: "1" }, error: null })
      .mockResolvedValueOnce({ data: { id: "2" }, error: null });
    renderStep();
    await act(async () => {
      fireEvent.click(screen.getByText("save"));
    });
    expect(apiRequest).toHaveBeenCalledWith(
      "/cms/api/page-draft/shop",
      expect.objectContaining({ method: "POST" }),
    );
    await screen.findByText("Draft saved");
    await act(async () => {
      fireEvent.click(screen.getByText("publish"));
    });
    expect(apiRequest).toHaveBeenCalledWith(
      "/cms/api/page/shop",
      expect.objectContaining({ method: "POST" }),
    );
    await screen.findByText("Page published");
  });

  it("handles navigation buttons", () => {
    renderStep();
    fireEvent.click(screen.getByTestId("back"));
    expect(push).toHaveBeenCalledWith("/cms/configurator/prev");
    fireEvent.click(screen.getByTestId("next"));
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(push).toHaveBeenCalledWith("/cms/configurator/next");
  });
});
