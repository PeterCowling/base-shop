import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

const markComplete = jest.fn();
jest.mock("../../hooks/useStepCompletion", () => ({
  __esModule: true,
  default: () => [false, markComplete],
}));

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const apiRequest = jest.fn();
jest.mock("../../lib/api", () => ({
  apiRequest: (...args: any[]) => apiRequest(...args),
}));

const ulidMock = jest.fn();
jest.mock("ulid", () => ({
  ulid: (...args: any[]) => ulidMock(...args),
}));

jest.mock(
  "@/components/cms/PageBuilder",
  () => ({
    __esModule: true,
    default: ({ onSave, onChange }: any) => (
      <div>
        <button onClick={() => onSave(new FormData())}>save</button>
        <button onClick={() => onChange([{ id: "changed" }])}>change</button>
      </div>
    ),
    Toast: ({ open, message }: any) => (open ? <div>{message}</div> : null),
  }),
  { virtual: true },
);

jest.mock(
  "@/components/atoms/shadcn",
  () => {
    const React = require("react");
    const Select = ({ value, onValueChange, children, ...props }: any) => {
      const [, content] = React.Children.toArray(children);
      return (
        <select
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          {...props}
        >
          {content?.props.children}
        </select>
      );
    };
    return {
      __esModule: true,
      Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
      Select,
      SelectContent: ({ children }: any) => <>{children}</>,
      SelectItem: ({ value, children }: any) => (
        <option value={value}>{children}</option>
      ),
      SelectTrigger: ({ children }: any) => <>{children}</>,
      SelectValue: ({ placeholder }: any) => (
        <option value="">{placeholder}</option>
      ),
    };
  },
  { virtual: true },
);

jest.mock("../../hooks/useThemeLoader", () => ({
  useThemeLoader: () => ({}),
}));

import StepCheckoutPage from "../StepCheckoutPage";

describe("StepCheckoutPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderStep = () => {
    const setCheckoutLayout = jest.fn();
    const setCheckoutComponents = jest.fn();
    const setCheckoutPageId = jest.fn();
    const props = {
      pageTemplates: [
        { name: "tpl1", components: [{ type: "one" }] },
        { name: "tpl2", components: [{ type: "two" }, { type: "three" }] },
      ],
      checkoutLayout: "",
      setCheckoutLayout,
      checkoutComponents: [],
      setCheckoutComponents,
      checkoutPageId: null,
      setCheckoutPageId,
      shopId: "shop1",
      themeStyle: {},
    };
    render(<StepCheckoutPage {...props} />);
    return { setCheckoutLayout, setCheckoutComponents, setCheckoutPageId };
  };

  it("maps selected template to components", () => {
    const { setCheckoutLayout, setCheckoutComponents } = renderStep();
    ulidMock.mockReturnValueOnce("id1").mockReturnValueOnce("id2");
    fireEvent.change(screen.getByTestId("checkout-layout"), {
      target: { value: "tpl2" },
    });
    expect(setCheckoutLayout).toHaveBeenCalledWith("tpl2");
    expect(setCheckoutComponents).toHaveBeenCalledWith([
      { type: "two", id: "id1" },
      { type: "three", id: "id2" },
    ]);
  });

  it("saves draft and shows toast", async () => {
    const { setCheckoutPageId } = renderStep();
    apiRequest.mockResolvedValueOnce({ data: { id: "p1" }, error: null });
    await act(async () => {
      fireEvent.click(screen.getByText("save"));
    });
    expect(apiRequest).toHaveBeenCalledWith(
      "/cms/api/page-draft/shop1",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
    expect(setCheckoutPageId).toHaveBeenCalledWith("p1");
    await screen.findByText("Draft saved");
  });

  it("marks complete and navigates away", () => {
    renderStep();
    fireEvent.click(screen.getByTestId("save-return"));
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator");
  });
});

