import { act, fireEvent, render, screen } from "@testing-library/react";
import { fetchJson } from "@acme/shared-utils";

jest.mock("@acme/shared-utils", () => ({ fetchJson: jest.fn() }));

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
  });

  it("shows success toast on publish", async () => {
    (fetchJson as jest.Mock).mockResolvedValueOnce([]); // initial load
    (fetchJson as jest.Mock).mockResolvedValueOnce({ id: "1" }); // publish
    render(<StepHomePage {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText("publish"));
    });
    await screen.findByText(/page published/i);
  });

  it("shows error toast on publish failure", async () => {
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
