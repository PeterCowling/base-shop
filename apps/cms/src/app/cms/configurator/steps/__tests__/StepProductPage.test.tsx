import type React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

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

jest.mock("../components/TemplateSelector", () => {
  const React = require("react");
  const MockTemplateSelector = ({ onSelect }: any) => (
    <button data-cy="template-selector" onClick={() => onSelect("Temp", [])}>
      template
    </button>
  );
  MockTemplateSelector.displayName = "MockTemplateSelector";
  return {
    __esModule: true,
    default: MockTemplateSelector,
  };
});


jest.mock("@/components/cms/ProductPageBuilder", () => {
  const React = require("react");
  const MockProductPageBuilder = () => <div>builder</div>;
  MockProductPageBuilder.displayName = "MockProductPageBuilder";
  return {
    __esModule: true,
    default: MockProductPageBuilder,
  };
});

jest.mock("@acme/design-system/atoms", () => {
  const React = require("react");
  const MockToast = ({ open, message }: any) => (open ? <div>{message}</div> : null);
  MockToast.displayName = "MockToast";
  return {
    __esModule: true,
    Toast: MockToast,
  };
});

jest.mock("@acme/design-system/shadcn", () => {
  const React = require("react");
  const MockButton = ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  );
  MockButton.displayName = "MockButton";
  return {
    __esModule: true,
    Button: MockButton,
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
