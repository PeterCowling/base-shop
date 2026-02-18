import { act, fireEvent, render, screen } from "@testing-library/react";

import { fetchJson } from "@acme/lib/http";

jest.mock("@acme/lib/http", () => ({ fetchJson: jest.fn() }));

// Share a single toast object so spies can be inspected by tests.
jest.mock("@acme/ui/operations", () => {
  const _t = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn(), loading: jest.fn(), dismiss: jest.fn() };
  return { useToast: () => _t };
});

jest.mock("../src/app/cms/configurator/components/TemplateSelector", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: function TemplateSelector() {
      return <div />;
    },
  };
});

jest.mock("../../../test/__mocks__/componentStub.js", () => {
  const React = require("react");
  const Empty = () => null;
  const PageBuilder = ({ onSave, onPublish, publishError }: any) => (
    <div>
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

jest.mock("@acme/lib");
jest.mock("../src/app/cms/configurator/hooks/useStepCompletion", () => ({
  __esModule: true,
  default: () => [false, jest.fn()],
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const StepHomePage =
  require("../src/app/cms/configurator/steps/StepHomePage").default;

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
  onBack: jest.fn(),
  onNext: jest.fn(),
};

describe("StepHomePage notifications", () => {
  beforeEach(() => {
    (fetchJson as jest.Mock).mockReset();
    // Clear spy call history on the shared toast object between tests.
    const { useToast } = jest.requireMock("@acme/ui/operations") as { useToast: () => Record<string, jest.Mock> };
    const toast = useToast();
    Object.values(toast).forEach((fn) => fn.mockClear());
  });

  it("calls toast.success on publish", async () => {
    const { useToast } = jest.requireMock("@acme/ui/operations") as { useToast: () => Record<string, jest.Mock> };
    const toast = useToast();

    (fetchJson as jest.Mock).mockResolvedValueOnce([]); // initial load
    (fetchJson as jest.Mock).mockResolvedValueOnce({ id: "1" }); // publish
    render(<StepHomePage {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText("publish"));
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("shows error message on publish failure", async () => {
    (fetchJson as jest.Mock).mockResolvedValueOnce([]); // initial load
    (fetchJson as jest.Mock).mockRejectedValueOnce(
      new Error("failed to publish page"),
    );
    render(<StepHomePage {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText("publish"));
    });
    await screen.findByText(/failed to publish page/i);
  });
});
