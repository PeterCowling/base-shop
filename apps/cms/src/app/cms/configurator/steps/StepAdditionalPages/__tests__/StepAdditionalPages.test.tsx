import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const markCompleteMock = jest.fn();
const pushMock = jest.fn();
const setPages = jest.fn();

jest.mock(
  require.resolve(
    "../../../../../../../../../test/__mocks__/componentStub.js",
  ),
  () => {
  const React = require("react");
  const PageBuilder = ({ onSave }: any) => (
    <div>
      <span>page builder</span>
      <button onClick={() => onSave(new FormData())}>save builder</button>
    </div>
  );
  return new Proxy(PageBuilder, {
    get: (_target, prop) => {
      if (prop === "Button") {
        return ({ children, ...props }: any) => (
          <button {...props}>{children}</button>
        );
      }
      if (prop === "Toast") {
        return ({ message }: any) => <div>{message}</div>;
      }
      return PageBuilder;
    },
    apply: (target, thisArg, args) => target.apply(thisArg, args),
  });
},
);

jest.mock("../PageLayoutSelector", () => ({
  __esModule: true,
  default: ({ setNewPageLayout, setNewComponents }: any) => (
    <div>
      <span>layout selector</span>
      <button
        onClick={() => {
          setNewPageLayout("layout");
          setNewComponents([{ id: "comp" }] as any);
        }}
      >
        choose layout
      </button>
    </div>
  ),
}));

jest.mock("../PageMetaForm", () => ({
  __esModule: true,
  default: ({ slug, setSlug, setTitle, setDesc, setImage }: any) => (
    <div>
      <span>meta form</span>
      <span data-testid="slug-display">{slug}</span>
      <button
        onClick={() => {
          setSlug("slug");
          setTitle("title");
          setDesc("desc");
          setImage("image");
        }}
      >
        fill meta
      </button>
    </div>
  ),
}));

jest.mock(
  "@/components/cms/PageBuilder",
  () => ({
    __esModule: true,
    default: ({ onSave }: any) => (
      <div>
        <span>page builder</span>
        <button onClick={() => onSave(new FormData())}>save builder</button>
      </div>
    ),
  }),
  { virtual: true },
);

jest.mock("../../../hooks/useStepCompletion", () => ({
  __esModule: true,
  default: () => [false, markCompleteMock],
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("../../../lib/api", () => ({
  apiRequest: jest.fn(),
}));
import { apiRequest } from "../../../lib/api";
const apiRequestMock = apiRequest as jest.Mock;
apiRequestMock.mockResolvedValue({ data: { id: "id1" }, error: null });

import StepAdditionalPages from "../StepAdditionalPages";

describe("StepAdditionalPages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiRequestMock.mockResolvedValue({ data: { id: "id1" }, error: null });
  });

  it("adds a page and saves draft", async () => {
    const user = userEvent.setup();
    render(
      <StepAdditionalPages
        pageTemplates={[{ name: "t", components: [] }]}
        pages={[]}
        setPages={setPages}
        shopId="shop"
        themeStyle={{}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add page/i }));
    expect(screen.getByText("layout selector")).toBeInTheDocument();
    expect(screen.getByText("meta form")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "choose layout" }));
    await user.click(screen.getByRole("button", { name: "fill meta" }));
    await user.click(screen.getByRole("button", { name: "save builder" }));
    expect(apiRequestMock).toHaveBeenCalled();
    await screen.findByText("Draft saved");

    await user.click(
      screen.getByRole("button", { name: /^add page$/i }),
    );
    expect(setPages).toHaveBeenCalledTimes(1);
    const newPages = setPages.mock.calls[0][0];
    expect(newPages).toHaveLength(1);
    expect(newPages[0].slug).toBe("slug");
  });

  it("cancel clears form and hides builder", async () => {
    const user = userEvent.setup();
    render(
      <StepAdditionalPages
        pageTemplates={[]}
        pages={[]}
        setPages={setPages}
        shopId="shop"
        themeStyle={{}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add page/i }));
    await user.click(screen.getByRole("button", { name: "fill meta" }));
    expect(screen.getByTestId("slug-display")).toHaveTextContent("slug");

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText("layout selector")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add page/i }));
    expect(screen.getByTestId("slug-display")).toHaveTextContent("");
  });

  it("saves and returns", async () => {
    const user = userEvent.setup();
    render(
      <StepAdditionalPages
        pageTemplates={[]}
        pages={[]}
        setPages={setPages}
        shopId="shop"
        themeStyle={{}}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /save & return/i }),
    );
    expect(markCompleteMock).toHaveBeenCalledWith(true);
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator");
  });
});
