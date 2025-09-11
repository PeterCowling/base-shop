import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

jest.mock("../hooks/useProductPageData", () => ({
  __esModule: true,
  default: () => ({
    saveDraft: jest.fn(),
    publishPage: jest.fn(),
    isSaving: false,
    isPublishing: false,
    saveError: null,
    publishError: null,
  }),
}));

jest.mock("../components/TemplateSelector", () => ({ onSelect }: any) => (
  <button data-cy="template-selector" onClick={() => onSelect("Temp", [])}>
    template
  </button>
));


jest.mock("@/components/cms/ProductPageBuilder", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => <div>builder</div>,
  };
});

jest.mock("@ui/components/atoms", () => {
  const React = require("react");
  return {
    __esModule: true,
    Toast: ({ open, message }: any) => (open ? <div>{message}</div> : null),
  };
});

jest.mock("@ui/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
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

describe("StepProductPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks complete and navigates on Save & return", () => {
    setup();
    fireEvent.click(screen.getByTestId("save-return"));
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator");
  });
});

